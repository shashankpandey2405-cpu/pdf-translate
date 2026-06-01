import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { AI_PLUS_MAX_PAGES } from "@/server/ai/config";
import { extractPdfTextFromBytes, totalExtractedChars } from "@/server/ai/extractPdfText";
import { getCachedExtractedText, setCachedExtractedText } from "@/server/ai/textCache";
import { buildSummaryPdf, buildTranslatedPdf } from "@/server/ai/buildTranslatedPdf";
import { AiProviderError, summarizeDocumentText, translateDocumentText } from "@/server/ai/documentAi";
import { postAiWorkerCallback } from "@/server/ai/workerCallback";
import { settleAiCredits } from "@/server/credits/calculator";
import { releaseCreditHold, settleCreditHold } from "@/server/credits/ledger";
import { saveAiSession } from "@/server/ai/sessionStore";
import { generateSuggestedQuestions } from "@/server/ai/suggestQuestions";
import {
  CHAT_VISION_QUALITY_HINT,
  generateChatDocumentBrief,
  shouldEnhanceScanForChat,
} from "@/server/ai/chatDocumentBrief";
import { summaryMaxTokens } from "@/lib/ai/summarizeTier";
import { outputKeyForJob } from "@/server/enhanced/jobStore";
import { getObjectBytes, putObjectBytes } from "@/server/s3Objects";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { analyzeDocumentImage, analyzeMultiplePages } from "@/server/ai/visionAnalyze";
import { reconstructDocument } from "@/server/ai/documentReconstruct";
import { extractPdfPagesForVision } from "@/server/ai/extractPdfPage";
import { analysesToExcerpt, saveSmartScanAnalysis } from "@/server/ai/smartScanStore";
import type { DocumentAnalysis } from "@/server/ai/visionAnalyze";

export type AiJobOptions = {
  toolSlug?: string;
  jobType?: "translate" | "summarize";
  sourceLang?: string;
  targetLang?: string;
  outputLang?: string;
  processingMode?: string;
  isPremium?: boolean;
  creditHoldAmount?: number;
  usedTrial?: boolean;
  aiTier?: "standard" | "advanced";
  summaryLength?: "short" | "medium" | "long";
  outputFormat?: string;
  questionTypes?: string;
  questionCount?: number;
  questionDifficulty?: string;
};

async function resolveUserPremium(userId: string, options: AiJobOptions): Promise<boolean> {
  if (options.isPremium === true) return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || !isSupabaseConfigured()) return false;
  try {
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await admin
      .from("profiles")
      .select("is_premium, premium_until")
      .eq("id", userId)
      .maybeSingle();
    if (!data?.is_premium) return false;
    if (data.premium_until) return new Date(data.premium_until).getTime() > Date.now();
    return true;
  } catch {
    return false;
  }
}

async function finalizeSmartScanSession(
  jobId: string,
  userId: string,
  analyses: DocumentAnalysis[],
  opts: { isPremium?: boolean; pageCount?: number } = {},
): Promise<void> {
  await saveSmartScanAnalysis(jobId, userId, analyses);
  const excerpt = analysesToExcerpt(analyses);
  let suggestedQuestions: string[] = [];
  try {
    suggestedQuestions = await generateSuggestedQuestions("", excerpt, {
      isPremium: opts.isPremium,
      pageCount: opts.pageCount ?? analyses.length,
    });
  } catch {
    suggestedQuestions = [
      "Add a signature line at the bottom",
      "Update the dates on this document",
      "Add a paragraph about payment terms",
      "Translate the document to English",
    ];
  }
  await saveAiSession({
    jobId,
    userId,
    summaryText: "",
    documentExcerpt: excerpt,
    suggestedQuestions,
    aiTier: "standard",
    length: "medium",
    outputLang: analyses[0]?.language ?? "en",
    createdAt: new Date().toISOString(),
  });
}

export async function processAiJob(
  jobId: string,
  inputR2Key: string,
  options: AiJobOptions,
  traceId?: string,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data: job } = await admin
    .from("processing_jobs")
    .select("id, user_id, tool_slug, trace_id, pages, file_size_bytes")
    .eq("id", jobId)
    .maybeSingle();

  if (!job?.user_id) {
    throw new Error("job_not_found");
  }

  const userId = job.user_id as string;
  const toolSlug = (options.toolSlug as string) || (job.tool_slug as string) || "ai-summarize";
  const jobType =
    toolSlug === "ai-question-gen" ? "question-gen" :
    toolSlug === "smart-scan-ai" ? "smart-scan" :
    toolSlug === "chat-pdf" ? "chat" :
    options.jobType === "translate" || toolSlug === "translate-pdf" ? "translate" : "summarize";
  const tid = traceId || (job.trace_id as string) || jobId;
  const aiTier = options.aiTier === "advanced" ? "advanced" : "standard";
  const summaryLength = options.summaryLength ?? "medium";
  const isPremium =
    aiTier === "advanced" ? true : await resolveUserPremium(userId, options);
  const fileSizeBytes =
    typeof job.file_size_bytes === "number" ? job.file_size_bytes : undefined;
  const usedTrial = options.usedTrial === true;
  const hasCreditHold = typeof options.creditHoldAmount === "number" && options.creditHoldAmount > 0;

  await postAiWorkerCallback({ jobId, status: "processing", progress: 10, traceId: tid });

  try {
    const chatPdfMaxPages = 10;
    const pageCap = jobType === "chat"
      ? Math.min(typeof job.pages === "number" && job.pages > 0 ? job.pages : chatPdfMaxPages, chatPdfMaxPages)
      : Math.min(typeof job.pages === "number" && job.pages > 0 ? job.pages : AI_PLUS_MAX_PAGES, AI_PLUS_MAX_PAGES);

    console.info(`[ai-processor] START jobId=${jobId} tool=${toolSlug} type=${jobType} tier=${aiTier} premium=${isPremium}`);
    const fileBytes = await getObjectBytes(inputR2Key);
    console.info(`[ai-processor] file downloaded: ${fileBytes.byteLength} bytes from ${inputR2Key}`);

    if (jobType === "smart-scan") {
      await postAiWorkerCallback({ jobId, status: "processing", progress: 10, traceId: tid });

      const isImage = /\.(jpg|jpeg|png|webp|heic)$/i.test(inputR2Key);
      const fileSizeKb = Math.round(fileBytes.byteLength / 1024);
      const qualityHint =
        fileSizeKb < 50 ? "Very small file — likely low quality or thumbnail. Take extra care reading text." :
        fileSizeKb < 150 ? "Small file — may be compressed or low resolution." :
        undefined;

      console.info(
        `[ai-processor] smart-scan: isImage=${isImage} size=${fileSizeKb}KB ` +
        `quality=${qualityHint ? "low" : "normal"} premium=${isPremium}`,
      );

      if (isImage) {
        await postAiWorkerCallback({ jobId, status: "processing", progress: 15, traceId: tid });
        const imageBase64 = Buffer.from(fileBytes).toString("base64");
        const mimeType = inputR2Key.toLowerCase().endsWith(".png") ? "image/png"
          : inputR2Key.toLowerCase().endsWith(".webp") ? "image/webp"
          : "image/jpeg";

        console.info(`[ai-processor] smart-scan: single image analysis (${mimeType})`);
        await postAiWorkerCallback({ jobId, status: "processing", progress: 25, traceId: tid });

        const { analysis, usage } = await analyzeDocumentImage(imageBase64, mimeType, {
          isPremium,
          pageNum: 1,
          qualityHint,
        });

        console.info(
          `[ai-processor] smart-scan: analysis done — ${analysis.blocks.length} blocks, ` +
          `type=${analysis.documentType}, lang=${analysis.language}, confidence=${analysis.confidence}`,
        );

        await postAiWorkerCallback({ jobId, status: "processing", progress: 65, traceId: tid });
        const outBytes = await reconstructDocument([analysis], { addWatermark: !isPremium, onePagePerSource: true });
        console.info(`[ai-processor] smart-scan: PDF reconstructed — ${outBytes.byteLength} bytes`);

        await postAiWorkerCallback({ jobId, status: "processing", progress: 85, traceId: tid });
        const outputKey = outputKeyForJob(userId, jobId, "pdf");
        await putObjectBytes(outputKey, outBytes, "application/pdf");

        if (hasCreditHold && !usedTrial) {
          const actual = settleAiCredits({
            toolSlug,
            pageCount: 1,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            modelId: usage.model,
          });
          await settleCreditHold(jobId, actual);
        }

        await finalizeSmartScanSession(jobId, userId, [analysis], { isPremium, pageCount: 1 });

        await postAiWorkerCallback({
          jobId, status: "done", outputR2Key: outputKey, progress: 100, traceId: tid,
        });
        return;
      }

      // PDF input — multi-page processing
      console.info(`[ai-processor] smart-scan: PDF input, encoding pages as base64 for vision AI`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 15, traceId: tid });

      const smartScanMaxPages = isPremium ? 5 : 2;
      const pdfBase64 = Buffer.from(fileBytes).toString("base64");

      // For PDF we send the whole file to vision AI — the API handles PDF natively
      const pageCount = typeof job.pages === "number" && job.pages > 0
        ? Math.min(job.pages, smartScanMaxPages)
        : 1;

      console.info(`[ai-processor] smart-scan: processing ${pageCount} page(s) from PDF`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 20, traceId: tid });

      let allAnalyses: import("@/server/ai/visionAnalyze").DocumentAnalysis[] = [];
      let totalUsage = { promptTokens: 0, completionTokens: 0, model: "" };

      if (pageCount <= 1) {
        const { analysis, usage } = await analyzeDocumentImage(pdfBase64, "application/pdf", {
          isPremium,
          pageNum: 1,
          qualityHint,
        });
        allAnalyses = [analysis];
        totalUsage = usage;
      } else {
        const pagePdfBytes = await extractPdfPagesForVision(fileBytes, pageCount);
        const pages: Array<{ imageBase64: string; mimeType: string }> = pagePdfBytes.map((bytes) => ({
          imageBase64: Buffer.from(bytes).toString("base64"),
          mimeType: "application/pdf",
        }));

        const result = await analyzeMultiplePages(pages, { isPremium, qualityHint });
        allAnalyses = result.analyses;
        totalUsage = result.totalUsage;

        for (let i = 0; i < allAnalyses.length; i++) {
          const progressPct = 20 + Math.round((i / allAnalyses.length) * 40);
          await postAiWorkerCallback({ jobId, status: "processing", progress: progressPct, traceId: tid });
        }
      }

      console.info(
        `[ai-processor] smart-scan: all pages analyzed — ` +
        `${allAnalyses.length} pages, ${allAnalyses.reduce((s, a) => s + a.blocks.length, 0)} total blocks, ` +
        `tokens in=${totalUsage.promptTokens} out=${totalUsage.completionTokens}`,
      );

      await postAiWorkerCallback({ jobId, status: "processing", progress: 65, traceId: tid });
      console.info(`[ai-processor] smart-scan: reconstructing multi-page document...`);

      const outBytes = await reconstructDocument(allAnalyses, { addWatermark: !isPremium, onePagePerSource: true });
      console.info(`[ai-processor] smart-scan: PDF reconstructed — ${outBytes.byteLength} bytes`);

      await postAiWorkerCallback({ jobId, status: "processing", progress: 85, traceId: tid });
      const outputKey = outputKeyForJob(userId, jobId, "pdf");
      await putObjectBytes(outputKey, outBytes, "application/pdf");

      if (hasCreditHold && !usedTrial) {
        const actual = settleAiCredits({
          toolSlug,
          pageCount: allAnalyses.length,
          promptTokens: totalUsage.promptTokens,
          completionTokens: totalUsage.completionTokens,
          modelId: totalUsage.model,
        });
        await settleCreditHold(jobId, actual);
      }

      await finalizeSmartScanSession(jobId, userId, allAnalyses, {
        isPremium,
        pageCount: allAnalyses.length,
      });

      await postAiWorkerCallback({
        jobId, status: "done", outputR2Key: outputKey, progress: 100, traceId: tid,
      });
      return;
    }

    const pdfBytes = fileBytes;
    const pageRangeKey = `1-${pageCap}`;
    let pages: Awaited<ReturnType<typeof extractPdfTextFromBytes>>;
    const cachedText = await getCachedExtractedText(inputR2Key, pageRangeKey);
    if (cachedText) {
      try {
        pages = JSON.parse(cachedText) as Awaited<ReturnType<typeof extractPdfTextFromBytes>>;
      } catch {
        pages = await extractPdfTextFromBytes(pdfBytes, pageCap);
        await setCachedExtractedText(inputR2Key, pageRangeKey, JSON.stringify(pages));
      }
    } else {
      pages = await extractPdfTextFromBytes(pdfBytes, pageCap);
      await setCachedExtractedText(inputR2Key, pageRangeKey, JSON.stringify(pages));
    }
    console.info(`[ai-processor] Text extracted: ${pages.length} pages, ${totalExtractedChars(pages)} chars`);

    let visionUsage = { promptTokens: 0, completionTokens: 0, model: "" };
    const extractedChars = totalExtractedChars(pages);
    const enhanceForChat =
      jobType === "chat" &&
      shouldEnhanceScanForChat(extractedChars, pages.length, fileBytes.byteLength);
    const useVisionFallback = extractedChars < 40 || enhanceForChat;
    let readMethod: "text" | "vision_enhanced" = "text";

    if (useVisionFallback) {
      console.info(
        `[ai-processor] ${enhanceForChat ? "chat scan enhance" : "low text"} — vision read`,
      );
      await postAiWorkerCallback({ jobId, status: "processing", progress: 22, traceId: tid });
      const { extractPdfTextWithVisionFallback } = await import("@/server/ai/visionTextFallback");
      const vision = await extractPdfTextWithVisionFallback(pdfBytes, pageCap, {
        isPremium,
        qualityHint: enhanceForChat ? CHAT_VISION_QUALITY_HINT : undefined,
        onPageProgress: async (i, total) => {
          const pct = 22 + Math.round(((i + 1) / Math.max(total, 1)) * 16);
          await postAiWorkerCallback({ jobId, status: "processing", progress: pct, traceId: tid });
        },
      });
      if (vision.usedVision && totalExtractedChars(vision.pages) >= 20) {
        pages = vision.pages;
        visionUsage = vision.usage;
        readMethod = "vision_enhanced";
        await setCachedExtractedText(inputR2Key, pageRangeKey, JSON.stringify(pages));
        console.info(
          `[ai-processor] vision read OK: ${totalExtractedChars(pages)} chars from ${pages.length} page(s)`,
        );
      }
    }

    if (totalExtractedChars(pages) < 40) {
      await releaseCreditHold(jobId);
      await postAiWorkerCallback({
        jobId,
        status: "failed",
        errorCode: "needs_ocr",
        errorMessage:
          "We could not read enough text from this file. Try a clearer scan, or use OCR PDF / Smart Scan AI first.",
        traceId: tid,
      });
      return;
    }

    await postAiWorkerCallback({ jobId, status: "processing", progress: 40, traceId: tid });

    if (jobType === "chat") {
      console.info(`[ai-processor] chat-pdf: preparing chat session...`);
      const fullText = pages.map((p) => p.text).join("\n\n");
      const excerpt = fullText.slice(0, 20000);

      await postAiWorkerCallback({ jobId, status: "processing", progress: 55, traceId: tid });

      const brief = await generateChatDocumentBrief(excerpt, {
        isPremium,
        fileSizeBytes,
        pageCount: pages.length,
        readMethod,
      });

      await postAiWorkerCallback({ jobId, status: "processing", progress: 75, traceId: tid });

      await saveAiSession({
        jobId,
        userId,
        summaryText: brief.summaryText,
        documentExcerpt: excerpt,
        suggestedQuestions: brief.suggestedQuestions,
        documentHighlights: brief.highlights,
        suggestedActions: brief.suggestedActions,
        readMethod,
        aiTier,
        length: "medium",
        outputLang: "English",
        createdAt: new Date().toISOString(),
      });

      if (hasCreditHold && !usedTrial) {
        await releaseCreditHold(jobId);
      }

      console.info(`[ai-processor] chat-pdf session ready, ${pages.length} pages, ${excerpt.length} chars`);
      await postAiWorkerCallback({
        jobId,
        status: "done",
        progress: 100,
        traceId: tid,
      });
      return;
    }

    if (jobType === "question-gen") {
      console.info(`[ai-processor] question-gen: starting generation...`);
      const fullText = pages.map((p) => p.text).join("\n\n");
      const excerpt = fullText.slice(0, 15000);
      const qTypes = options.questionTypes || "mcq";
      const qCount = options.questionCount || 10;
      const qDifficulty = options.questionDifficulty || "medium";

      await postAiWorkerCallback({ jobId, status: "processing", progress: 50, traceId: tid });

      const { questionGenGuardrails, parseQuestionGenResponse } = await import("@/server/ai/questionGen");
      const prompt = `${questionGenGuardrails({
        questionCount: qCount,
        questionTypes: qTypes,
        difficulty: qDifficulty,
      })}

DOCUMENT TEXT:
${excerpt}`;

      const { modelChainForWorkload } = await import("@/server/ai/router");
      const { openRouterChatCompletion } = await import("@/server/ai/openrouter");
      const chain = modelChainForWorkload({
        task: "summarize",
        pageCount: pages.length,
        totalChars: excerpt.length,
        fileSizeBytes,
        isPremium,
      });

      let rawResponse = "";
      let qUsage = { promptTokens: 0, completionTokens: 0, model: chain[0] ?? "unknown" };
      for (const modelId of chain) {
        try {
          const res = await openRouterChatCompletion(modelId, prompt, 4000);
          rawResponse = res.text;
          qUsage = res.usage;
          break;
        } catch (e) {
          console.warn(`[ai-processor] question-gen model ${modelId} failed`, e);
        }
      }

      await postAiWorkerCallback({ jobId, status: "processing", progress: 80, traceId: tid });

      const questions = parseQuestionGenResponse(rawResponse, excerpt, {
        questionTypes: qTypes,
        maxCount: qCount,
      });

      if (!questions.length) {
        await releaseCreditHold(jobId);
        await postAiWorkerCallback({
          jobId,
          status: "failed",
          errorCode: "question_gen_failed",
          errorMessage: "AI could not generate questions from this document. Try a different PDF with more text content.",
          traceId: tid,
        });
        return;
      }

      console.info(`[ai-processor] question-gen: generated ${questions.length} questions`);

      await saveAiSession({
        jobId,
        userId,
        summaryText: JSON.stringify({ questions }),
        documentExcerpt: excerpt.slice(0, 5000),
        suggestedQuestions: [],
        aiTier,
        length: "medium",
        outputLang: "English",
        createdAt: new Date().toISOString(),
      });

      if (hasCreditHold && !usedTrial) {
        const actual = settleAiCredits({
          toolSlug,
          pageCount: pages.length,
          promptTokens: qUsage.promptTokens,
          completionTokens: qUsage.completionTokens,
          modelId: qUsage.model,
        });
        await settleCreditHold(jobId, actual);
      }

      await postAiWorkerCallback({
        jobId,
        status: "done",
        progress: 100,
        traceId: tid,
      });
      return;
    }

    let outBytes: Uint8Array;
    let usage = { promptTokens: 0, completionTokens: 0, model: "" };

    if (jobType === "translate") {
      const sourceLang = options.sourceLang || "English";
      const targetLang = options.targetLang || "Hindi";
      console.info(`[ai-processor] translate: ${sourceLang} → ${targetLang}`);
      const result = await translateDocumentText(
        pages.map((p) => p.text),
        sourceLang,
        targetLang,
        { isPremium, fileSizeBytes },
      );
      usage = result.usage;
      console.info(`[ai-processor] translate AI done, building PDF...`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 75, traceId: tid });
      outBytes = await buildTranslatedPdf(pdfBytes, result.pages);
      console.info(`[ai-processor] translate PDF built: ${outBytes.byteLength} bytes`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 90, traceId: tid });
    } else {
      const outputLang = options.outputLang || options.targetLang || "English";
      console.info(`[ai-processor] summarize: lang=${outputLang} length=${summaryLength}`);
      const result = await summarizeDocumentText(
        pages.map((p) => p.text),
        outputLang,
        {
          isPremium,
          fileSizeBytes,
          length: summaryLength,
          maxTokens: summaryMaxTokens(summaryLength),
        },
      );
      usage = result.usage;
      console.info(`[ai-processor] summarize AI done, saving session...`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 65, traceId: tid });
      const excerpt = pages.map((p) => p.text).join("\n\n").slice(0, 12000);
      const suggestedQuestions = await generateSuggestedQuestions(result.summary, excerpt, {
        isPremium,
        fileSizeBytes,
        pageCount: pages.length,
      });
      await saveAiSession({
        jobId,
        userId,
        summaryText: result.summary,
        documentExcerpt: excerpt,
        suggestedQuestions,
        aiTier,
        length: summaryLength,
        outputLang,
        createdAt: new Date().toISOString(),
      });
      console.info(`[ai-processor] session saved, building PDF...`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 80, traceId: tid });
      outBytes = await buildSummaryPdf(result.summary, "PDF Summary — PDFTrusted AI");
      console.info(`[ai-processor] summary PDF built: ${outBytes.byteLength} bytes`);
      await postAiWorkerCallback({ jobId, status: "processing", progress: 90, traceId: tid });
    }

    const outputKey = outputKeyForJob(userId, jobId, "pdf");
    await putObjectBytes(outputKey, outBytes, "application/pdf");

    if (hasCreditHold && !usedTrial) {
      const actual = settleAiCredits({
        toolSlug,
        pageCount: pages.length,
        promptTokens: usage.promptTokens + visionUsage.promptTokens,
        completionTokens: usage.completionTokens + visionUsage.completionTokens,
        modelId: visionUsage.model ? `${usage.model}+${visionUsage.model}` : usage.model,
      });
      await settleCreditHold(jobId, actual);
    }

    await postAiWorkerCallback({
      jobId,
      status: "done",
      outputR2Key: outputKey,
      progress: 100,
      traceId: tid,
    });
  } catch (e) {
    await releaseCreditHold(jobId);
    const code = e instanceof AiProviderError ? e.code : "processing_failed";
    const message = e instanceof Error ? e.message : "AI processing failed";
    console.error(`[ai-processor] FAILED jobId=${jobId} code=${code} message=${message}`);
    await postAiWorkerCallback({
      jobId,
      status: "failed",
      errorCode: code,
      errorMessage: message.slice(0, 500),
      traceId: tid,
    });
  }
}

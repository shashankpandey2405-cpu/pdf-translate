import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { postAiWorkerCallback } from "@/server/ai/workerCallback";
import { releaseCreditHold, settleCreditHold } from "@/server/credits/ledger";
import { settleClassicMtCredits } from "@/server/credits/calculator";
import { outputKeyForJob } from "@/server/enhanced/jobStore";
import { getObjectBytes, putObjectBytes } from "@/server/s3Objects";
import { hasPdfHeader, normalizePdfBytes, pdfHeaderHint } from "@/server/pdf/pdfBytes";
import { analyzePdfBytes } from "@/server/translate/analyzer";
import { resolveLangCode } from "@/server/translate/langCodes";
import { extractTextBlocks } from "@/server/translate/pipeline/extractBlocks";
import { translateTextBlocks } from "@/server/translate/pipeline/translateBlocks";
import { applyOverflowFitting } from "@/server/translate/pipeline/overflowEngine";
import { rebuildTranslatedPdf } from "@/server/translate/pipeline/rebuildPdf";
import type { ClassicTranslateJobOptions } from "@/server/translate/types";

const CHUNK_PAGES = 10;

export async function processClassicTranslateJob(
  jobId: string,
  inputR2Key: string,
  options: ClassicTranslateJobOptions,
  traceId?: string,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data: job } = await admin
    .from("processing_jobs")
    .select("id, user_id, tool_slug, status, pages")
    .eq("id", jobId)
    .maybeSingle();

  if (!job?.user_id) throw new Error("job_not_found");

  const jobStatus = job.status as string | undefined;
  if (jobStatus === "done" || jobStatus === "failed" || jobStatus === "cancelled") {
    console.info(`[classic-translate] skip jobId=${jobId} status=${jobStatus}`);
    return;
  }

  const userId = job.user_id as string;
  const tid = traceId ?? jobId;
  const hasCreditHold = typeof options.creditHoldAmount === "number" && options.creditHoldAmount > 0;

  try {
    await postAiWorkerCallback({ jobId, status: "processing", progress: 8, traceId: tid });

    const fileBytes = await getObjectBytes(inputR2Key);
    const normalized = normalizePdfBytes(fileBytes);
    if (!hasPdfHeader(normalized)) {
      await releaseCreditHold(jobId);
      await postAiWorkerCallback({
        jobId,
        status: "failed",
        errorCode: "invalid_pdf",
        errorMessage: `Invalid PDF: ${pdfHeaderHint(normalized)}`,
        traceId: tid,
      });
      return;
    }

    const analysis = await analyzePdfBytes(normalized);
    if (!analysis.isDigital || analysis.isScanned) {
      await releaseCreditHold(jobId);
      await postAiWorkerCallback({
        jobId,
        status: "failed",
        errorCode: "needs_ai_translate",
        errorMessage:
          "This PDF needs AI translation (scanned or weak text layer). Classic translate only supports digital PDFs with selectable text.",
        traceId: tid,
      });
      return;
    }

    const maxPages =
      typeof options.maxProcessPages === "number" && options.maxProcessPages > 0
        ? Math.min(options.maxProcessPages, analysis.pages)
        : analysis.pages;

    const sourceCode =
      options.sourceLangCode ?? resolveLangCode(options.sourceLang ?? "English", "en");
    const targetCode =
      options.targetLangCode ?? resolveLangCode(options.targetLang ?? "Hindi", "hi");
    const layoutMode = options.layoutMode === "text_only" ? "text_only" : "keep_layout";

    console.info(
      `[classic-translate] jobId=${jobId} ${sourceCode}->${targetCode} pages=${maxPages} layout=${layoutMode}`,
    );

    await postAiWorkerCallback({ jobId, status: "processing", progress: 20, traceId: tid });

    let allRuns: Awaited<ReturnType<typeof translateTextBlocks>> = [];

    for (let start = 0; start < maxPages; start += CHUNK_PAGES) {
      const chunkPages = Math.min(CHUNK_PAGES, maxPages - start);
      const chunkBlocks = await extractTextBlocks(normalized, chunkPages, start);
      if (chunkBlocks.length === 0) continue;

      const pct = 20 + Math.round(((start + chunkPages) / maxPages) * 50);
      await postAiWorkerCallback({ jobId, status: "processing", progress: pct, traceId: tid });

      const translated = await translateTextBlocks(chunkBlocks, sourceCode, targetCode);
      allRuns = allRuns.concat(applyOverflowFitting(translated));
    }

    if (allRuns.length === 0) {
      await releaseCreditHold(jobId);
      await postAiWorkerCallback({
        jobId,
        status: "failed",
        errorCode: "needs_ocr",
        errorMessage: "No selectable text found. Use AI translation or OCR PDF first.",
        traceId: tid,
      });
      return;
    }

    await postAiWorkerCallback({ jobId, status: "processing", progress: 78, traceId: tid });

    const outBytes = await rebuildTranslatedPdf(normalized, allRuns, {
      maxPages,
      targetLangCode: targetCode,
      forceTextOnly: layoutMode === "text_only",
    });

    const outputKey = outputKeyForJob(userId, jobId, "pdf");
    await putObjectBytes(outputKey, outBytes, "application/pdf");

    if (hasCreditHold) {
      const actual = settleClassicMtCredits({ pageCount: maxPages });
      await settleCreditHold(jobId, actual);
    }

    await postAiWorkerCallback({
      jobId,
      status: "done",
      outputR2Key: outputKey,
      progress: 100,
      traceId: tid,
    });

    console.info(`[classic-translate] done jobId=${jobId} bytes=${outBytes.byteLength}`);
  } catch (err) {
    console.error(`[classic-translate] failed jobId=${jobId}`, err);
    await releaseCreditHold(jobId);
    await postAiWorkerCallback({
      jobId,
      status: "failed",
      errorCode: "processing_failed",
      errorMessage: err instanceof Error ? err.message.slice(0, 400) : "Classic translation failed",
      traceId: tid,
    });
    throw err;
  }
}

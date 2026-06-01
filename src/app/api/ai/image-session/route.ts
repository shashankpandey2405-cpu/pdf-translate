import { randomUUID } from "crypto";
import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { saveAiSession } from "@/server/ai/sessionStore";
import { generateSuggestedQuestions } from "@/server/ai/suggestQuestions";
import { generateChatDocumentBrief } from "@/server/ai/chatDocumentBrief";
import { summarizeDocumentText } from "@/server/ai/documentAi";
import { langLabel } from "@/lib/ai/translateLanguages";
import type { AiSummarizeTier, SummaryLength } from "@/lib/ai/summarizeTier";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { getAppEnv } from "@/server/types";
import { maxFileBytesForTier } from "@/lib/limits/fileSizePolicy";
import { assertCanRunAiPlus } from "@/server/ai/assertAiAccess";
import { settleAiCredits } from "@/server/credits/calculator";
import {
  getCreditBalance,
  releaseCreditHold,
  reserveCredits,
  settleCreditHold,
} from "@/server/credits/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function postHandler(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "ai_image_session", ipHourlyMax: 24 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);

  let body: {
    ocrText?: unknown;
    fileName?: unknown;
    toolSlug?: unknown;
    outputLang?: unknown;
    aiTier?: unknown;
    summaryLength?: unknown;
    fileSizeBytes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const ocrText = typeof body.ocrText === "string" ? body.ocrText.trim().slice(0, 20_000) : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "scan.jpg";
  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug : "chat-pdf";
  const fileSizeBytes =
    typeof body.fileSizeBytes === "number" ? body.fileSizeBytes : ocrText.length * 2;

  if (!ocrText || ocrText.length < 12) {
    return Response.json(
      { error: "ocr_empty", message: "Not enough text was detected in the image." },
      { status: 400 },
    );
  }

  if (fileSizeBytes > maxFileBytesForTier(isPremium)) {
    const mb = Math.round(maxFileBytesForTier(isPremium) / (1024 * 1024));
    return Response.json(
      {
        error: "file_too_large",
        message: isPremium
          ? `Image sources are limited to ${mb} MB on your plan.`
          : `Free limit is 15 MB. Compress your PDF or upgrade to Premium (${mb} MB).`,
        suggestCompress: !isPremium,
      },
      { status: 413 },
    );
  }

  const creditToolSlug = toolSlug === "ai-summarize" ? "ai-summarize" : "chat-pdf";
  const gate = await assertCanRunAiPlus({
    userId: user.id,
    toolSlug: creditToolSlug,
    pageCount: 1,
    fileSizeBytes,
    isPremium,
  });
  if (!gate.ok) {
    return Response.json({ error: gate.code, message: gate.message }, { status: gate.status });
  }

  const jobId = randomUUID();
  const holdId = `image-session-${jobId}`;
  if (!gate.useTrial) {
    const reserved = await reserveCredits(user.id, holdId, gate.estimateHigh, isPremium, {
      type: "ai_image_session",
      toolSlug: creditToolSlug,
    });
    if (!reserved.ok) {
      return Response.json(
        { error: reserved.code, message: reserved.message },
        { status: 402 },
      );
    }
  }

  const excerpt = ocrText.slice(0, 20_000);
  const outputLang = typeof body.outputLang === "string" ? langLabel(body.outputLang) : "English";
  const aiTier = (body.aiTier === "advanced" ? "advanced" : "standard") as AiSummarizeTier;
  const length = (["short", "medium", "long"].includes(String(body.summaryLength))
    ? body.summaryLength
    : "medium") as SummaryLength;

  try {
    if (toolSlug === "ai-summarize") {
      const { summary: summaryText, usage } = await summarizeDocumentText([excerpt], outputLang, {
        isPremium,
        fileSizeBytes,
        length,
      });
      const suggestedQuestions = await generateSuggestedQuestions(
        summaryText.slice(0, 4000),
        excerpt,
        { isPremium, fileSizeBytes, pageCount: 1 },
      );
      await saveAiSession({
        jobId,
        userId: user.id,
        summaryText,
        documentExcerpt: excerpt,
        suggestedQuestions,
        aiTier,
        length,
        outputLang,
        createdAt: new Date().toISOString(),
      });

      if (!gate.useTrial) {
        const actual = settleAiCredits({
          toolSlug: "ai-summarize",
          pageCount: 1,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          modelId: usage.model,
        });
        await settleCreditHold(holdId, actual);
      }

      const balance = await getCreditBalance(user.id, isPremium);
      return Response.json({
        jobId,
        toolSlug,
        fileName,
        summaryReady: true,
        session: {
          summaryText,
          suggestedQuestions,
          aiTier,
        },
        credits: balance,
      });
    }

    const brief = await generateChatDocumentBrief(excerpt, {
      isPremium,
      fileSizeBytes,
      pageCount: 1,
      readMethod: "vision_enhanced",
    });

    await saveAiSession({
      jobId,
      userId: user.id,
      summaryText: brief.summaryText,
      documentExcerpt: excerpt,
      suggestedQuestions: brief.suggestedQuestions,
      documentHighlights: brief.highlights,
      suggestedActions: brief.suggestedActions,
      readMethod: "vision_enhanced",
      aiTier: "standard",
      length: "medium",
      outputLang,
      createdAt: new Date().toISOString(),
    });

    if (!gate.useTrial) {
      const actual = settleAiCredits({
        toolSlug: "chat-pdf",
        pageCount: 1,
        promptTokens: Math.min(800, excerpt.length),
        completionTokens: 150,
      });
      await settleCreditHold(holdId, actual);
    }

    const balance = await getCreditBalance(user.id, isPremium);
    return Response.json({
      jobId,
      toolSlug,
      fileName,
      session: {
        summaryText: brief.summaryText,
        documentExcerpt: excerpt,
        suggestedQuestions: brief.suggestedQuestions,
        documentHighlights: brief.highlights,
        suggestedActions: brief.suggestedActions,
        readMethod: "vision_enhanced",
      },
      credits: balance,
    });
  } catch (e) {
    if (!gate.useTrial) await releaseCreditHold(holdId);
    const msg = e instanceof Error ? e.message : "Session failed";
    return Response.json({ error: "image_session_failed", message: msg }, { status: 500 });
  }
}

export const POST = withSentryRoute("ai.image-session", postHandler);

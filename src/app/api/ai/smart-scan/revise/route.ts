import { randomUUID } from "crypto";
import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSmartScanAnalysis, saveSmartScanAnalysisAfterRevise, analysesToExcerpt } from "@/server/ai/smartScanStore";
import { reviseSmartScanAnalyses } from "@/server/ai/reviseSmartScan";
import { reconstructDocument } from "@/server/ai/documentReconstruct";
import { saveAiSession } from "@/server/ai/sessionStore";
import { generateSuggestedQuestions } from "@/server/ai/suggestQuestions";
import { getCreditBalance, reserveCredits, settleCreditHold, releaseCreditHold } from "@/server/credits/ledger";
import { settleAiCredits } from "@/server/credits/calculator";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { getAppEnv } from "@/server/types";
import { outputKeyForJob } from "@/server/enhanced/jobStore";
import { putObjectBytes } from "@/server/s3Objects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVISE_CREDITS = 5;

async function postRevise(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "ai_revise", ipHourlyMax: 40 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: {
    jobId?: unknown;
    instruction?: unknown;
    attachments?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";

  type AttachmentIn = { name?: unknown; mimeType?: unknown; base64?: unknown };
  const attachmentsRaw = Array.isArray(body.attachments) ? (body.attachments as AttachmentIn[]) : [];
  const attachments = attachmentsRaw
    .map((a) => ({
      name: typeof a.name === "string" ? a.name.slice(0, 120) : "attachment",
      mimeType: typeof a.mimeType === "string" ? a.mimeType : "image/png",
      base64: typeof a.base64 === "string" ? a.base64.replace(/^data:[^;]+;base64,/, "") : "",
    }))
    .filter((a) => a.base64.length > 32 && a.base64.length <= 2_800_000 && a.mimeType.startsWith("image/"))
    .slice(0, 3);

  if (!jobId || !instruction) {
    return Response.json({ error: "invalid_request", message: "jobId and instruction are required." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: job } = await admin
    .from("processing_jobs")
    .select("id, user_id, tool_slug, status")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!job || job.tool_slug !== "smart-scan-ai" || job.status !== "done") {
    return Response.json({ error: "job_not_ready", message: "Complete Smart Scan reconstruction first." }, { status: 404 });
  }

  const analyses = await getSmartScanAnalysis(jobId, user.id);
  if (!analyses?.length) {
    return Response.json(
      { error: "analysis_expired", message: "Edit session expired. Run Smart Scan again on your file." },
      { status: 410 },
    );
  }

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);

  const holdId = `smartscan-revise-${randomUUID()}`;
  const reserved = await reserveCredits(user.id, holdId, REVISE_CREDITS, isPremium, {
    type: "ai_smart_scan_revise",
    jobId,
  });
  if (!reserved.ok) {
    return Response.json({ error: reserved.code, message: reserved.message }, { status: 402 });
  }

  try {
    const { revised, promptTokens, completionTokens, model } = await reviseSmartScanAnalyses(
      analyses,
      instruction,
      attachments,
    );
    const pdfBytes = await reconstructDocument(revised, { addWatermark: !isPremium });
    const outputKey = outputKeyForJob(user.id, jobId, "pdf");
    await putObjectBytes(outputKey, pdfBytes, "application/pdf");

    await admin
      .from("processing_jobs")
      .update({ output_r2_key: outputKey, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    await saveSmartScanAnalysisAfterRevise(jobId, user.id, revised);

    const excerpt = analysesToExcerpt(revised);
    const questions = await generateSuggestedQuestions("", excerpt, {
      isPremium,
      pageCount: revised.length,
    });
    await saveAiSession({
      jobId,
      userId: user.id,
      summaryText: "",
      documentExcerpt: excerpt,
      suggestedQuestions: questions,
      aiTier: "standard",
      length: "medium",
      outputLang: revised[0]?.language ?? "en",
      createdAt: new Date().toISOString(),
    });

    const actual = settleAiCredits({
      toolSlug: "smart-scan-ai",
      pageCount: revised.length,
      promptTokens,
      completionTokens,
      modelId: model,
    });
    await settleCreditHold(holdId, Math.max(REVISE_CREDITS, actual));

    const balance = await getCreditBalance(user.id, isPremium);

    return Response.json({
      ok: true,
      pdfBase64: Buffer.from(pdfBytes).toString("base64"),
      creditsCharged: Math.max(REVISE_CREDITS, actual),
      credits: balance,
      message: "Document updated successfully.",
    });
  } catch (e) {
    await releaseCreditHold(holdId);
    const msg = e instanceof Error ? e.message : "Revision failed";
    return Response.json({ error: "revise_failed", message: msg }, { status: 500 });
  }
}

export const POST = withSentryRoute("ai_smart_scan_revise", postRevise);

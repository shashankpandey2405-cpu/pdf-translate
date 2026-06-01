import { randomUUID } from "crypto";
import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { getAppEnv } from "@/server/types";
import { assertCanRunAiPlus } from "@/server/ai/assertAiAccess";
import { settleAiCredits } from "@/server/credits/calculator";
import {
  getCreditBalance,
  releaseCreditHold,
  reserveCredits,
  settleCreditHold,
} from "@/server/credits/ledger";
import { modelChainForWorkload } from "@/server/ai/router";
import { openRouterChatCompletion } from "@/server/ai/openrouter";
import {
  mergeAiPayloadIntoResume,
  parseResumeGenResponse,
  resumeGenGuardrails,
  type AiResumeIntake,
} from "@/server/ai/resumeGen";
import type { ResumeTemplateId } from "@/tools/resume/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TEMPLATE_IDS = new Set([
  "modern-executive",
  "classic-academic",
  "creative-portfolio",
  "minimalist-zen",
  "tech-innovator",
  "dubai-corporate",
  "ats-friendly",
  "standard-professional",
  "entrepreneur",
  "hybrid-flex",
  "government-formal",
  "international-eu",
  "international-us",
]);

function parseIntake(body: Record<string, unknown>): AiResumeIntake | null {
  const templateId = typeof body.templateId === "string" ? body.templateId : "ats-friendly";
  if (!TEMPLATE_IDS.has(templateId)) return null;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const jobField = typeof body.jobField === "string" ? body.jobField.trim() : "";
  const about = typeof body.about === "string" ? body.about.trim() : "";
  if (!fullName || !jobField || about.length < 20) return null;

  return {
    templateId: templateId as ResumeTemplateId,
    jobField,
    includePhoto: body.includePhoto === true,
    fullName,
    skills: typeof body.skills === "string" ? body.skills.trim() : "",
    experience: typeof body.experience === "string" ? body.experience.trim() : "",
    education: typeof body.education === "string" ? body.education.trim() : "",
    about,
  };
}

async function postHandler(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "ai_resume", ipHourlyMax: 20 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const intake = parseIntake(body);
  if (!intake) {
    return Response.json(
      { error: "invalid_intake", message: "Name, job field, and a detailed about section (20+ chars) are required." },
      { status: 400 },
    );
  }

  const photoDataUrl =
    intake.includePhoto && typeof body.photoDataUrl === "string" && body.photoDataUrl.startsWith("data:image/")
      ? body.photoDataUrl.slice(0, 500_000)
      : null;

  const textBlob = [
    intake.fullName,
    intake.jobField,
    intake.skills,
    intake.experience,
    intake.education,
    intake.about,
  ].join("\n");
  const totalChars = textBlob.length;

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);
  const toolSlug = "ai-resume-builder";

  const gate = await assertCanRunAiPlus({
    userId: user.id,
    toolSlug,
    pageCount: 1,
    fileSizeBytes: totalChars * 2,
    isPremium,
  });
  if (!gate.ok) {
    return Response.json({ error: gate.code, message: gate.message }, { status: gate.status });
  }

  const jobId = randomUUID();
  const holdId = `ai-resume-${jobId}`;
  if (!gate.useTrial) {
    const reserved = await reserveCredits(user.id, holdId, gate.estimateHigh, isPremium, {
      type: "ai_resume",
      toolSlug,
    });
    if (!reserved.ok) {
      return Response.json(
        { error: reserved.code, message: reserved.message },
        { status: reserved.code === "INSUFFICIENT_CREDITS" || reserved.code === "insufficient_credits" ? 402 : 400 },
      );
    }
  }

  try {
    const prompt = resumeGenGuardrails(intake);
    const chain = modelChainForWorkload({
      task: "summarize",
      pageCount: 1,
      totalChars,
      fileSizeBytes: totalChars * 2,
      isPremium,
    });

    let rawResponse = "";
    let usage = { promptTokens: 0, completionTokens: 0, model: chain[0] ?? "unknown" };
    for (const modelId of chain) {
      try {
        const res = await openRouterChatCompletion(modelId, prompt, 6000);
        rawResponse = res.text;
        usage = res.usage;
        break;
      } catch (e) {
        console.warn(`[ai-resume] model ${modelId} failed`, e);
      }
    }

    const payload = parseResumeGenResponse(rawResponse);
    if (!payload) {
      await releaseCreditHold(holdId);
      return Response.json(
        { error: "generation_failed", message: "AI could not structure your resume. Try again with more detail." },
        { status: 422 },
      );
    }

    const resumeData = mergeAiPayloadIntoResume(intake, payload, photoDataUrl);

    if (!gate.useTrial) {
      const actual = settleAiCredits({
        toolSlug,
        pageCount: 1,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        modelId: usage.model,
      });
      await settleCreditHold(holdId, actual);
    }

    const creditsCharged = gate.useTrial
      ? 0
      : settleAiCredits({
          toolSlug,
          pageCount: 1,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          modelId: usage.model,
        });

    const credits = await getCreditBalance(user.id, isPremium);

    return Response.json({
      ok: true,
      jobId,
      resumeData,
      creditsCharged,
      credits: { available: credits.available, balance: credits.balance },
    });
  } catch (e) {
    await releaseCreditHold(holdId);
    console.error("[ai-resume]", e);
    return Response.json(
      { error: "server_error", message: e instanceof Error ? e.message : "Resume generation failed." },
      { status: 500 },
    );
  }
}

export const POST = withSentryRoute("ai_resume", postHandler);

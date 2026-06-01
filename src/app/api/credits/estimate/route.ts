import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { estimateAiCredits, estimateClassicMtCredits } from "@/server/credits/calculator";
import { getCreditBalance } from "@/server/credits/ledger";
import { getAiTrialSnapshot } from "@/server/ai/usageLimits";
import { AI_LIFETIME_TRIAL_LIMIT, isAiToolSlug } from "@/server/ai/config";
import { getAppEnv } from "@/server/types";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { resolveAiPlusLimits } from "@/server/credits/aiWorkloadLimits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postEstimate(req: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: {
    toolSlug?: unknown;
    pageCount?: unknown;
    totalChars?: unknown;
    fileSize?: unknown;
    processingMode?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug : "";
  if (!toolSlug || !isAiToolSlug(toolSlug)) {
    return Response.json({ error: "unsupported_tool" }, { status: 400 });
  }

  const pageCount =
    typeof body.pageCount === "number" && Number.isFinite(body.pageCount)
      ? Math.max(1, Math.floor(body.pageCount))
      : 1;
  const totalChars =
    typeof body.totalChars === "number" && Number.isFinite(body.totalChars)
      ? body.totalChars
      : undefined;
  const fileSizeBytes =
    typeof body.fileSize === "number" && Number.isFinite(body.fileSize) ? body.fileSize : undefined;

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);
  const aiTrial = await getAiTrialSnapshot(user.id);
  const credits = await getCreditBalance(user.id, isPremium);
  const processingMode =
    body.processingMode === "classic_mt" ? "classic_mt" : "ai_plus";

  const estimate =
    processingMode === "classic_mt" && toolSlug === "translate-pdf"
      ? estimateClassicMtCredits({
          toolSlug,
          pageCount,
          totalChars,
          fileSizeBytes,
          isPremium,
        })
      : estimateAiCredits({
          toolSlug,
          pageCount,
          totalChars,
          fileSizeBytes,
          isPremium,
        });

  const useTrial =
    AI_LIFETIME_TRIAL_LIMIT > 0 &&
    processingMode === "ai_plus" &&
    aiTrial.trialRemaining > 0;

  const limits =
    processingMode === "ai_plus" || processingMode === "classic_mt"
      ? resolveAiPlusLimits({
          toolSlug,
          isPremium,
          creditAvailable: credits.available,
          useTrial,
        })
      : null;

  const withinLimits =
    !limits ||
    (pageCount <= limits.maxPages &&
      (fileSizeBytes == null || fileSizeBytes <= limits.maxFileBytes));

  return Response.json({
    toolSlug,
    pageCount,
    estimate: estimate.estimate,
    estimateHigh: estimate.estimateHigh,
    breakdown: estimate.breakdown,
    maxPages: limits?.maxPages,
    maxFileBytes: limits?.maxFileBytes,
    credits: {
      balance: credits.balance,
      available: credits.available,
      reserved: credits.reserved,
      monthlyGrant: credits.monthlyGrant,
    },
    aiTrial,
    useTrial,
    canProceed:
      withinLimits && (useTrial || credits.available >= estimate.estimateHigh),
    limitMessage:
      !withinLimits && limits
        ? pageCount > limits.maxPages
          ? `Your credits support up to ${limits.maxPages} pages for this file.`
          : `Your credits support files up to ${Math.round(limits.maxFileBytes / (1024 * 1024))} MB.`
        : undefined,
  });
}

export const POST = withSentryRoute("credits_estimate", postEstimate);

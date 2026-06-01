import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { estimateAiCredits } from "@/server/credits/calculator";
import { getCreditBalance } from "@/server/credits/ledger";
import { getAiTrialSnapshot } from "@/server/ai/usageLimits";
import { AI_LIFETIME_TRIAL_LIMIT, isAiToolSlug } from "@/server/ai/config";
import { getAppEnv } from "@/server/types";
import { resolveIsPremium } from "@/server/premiumEntitlement";

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

  const estimate = estimateAiCredits({
    toolSlug,
    pageCount,
    totalChars,
    fileSizeBytes,
    isPremium,
  });

  const useTrial = AI_LIFETIME_TRIAL_LIMIT > 0 && aiTrial.trialRemaining > 0;

  return Response.json({
    toolSlug,
    pageCount,
    estimate: estimate.estimate,
    estimateHigh: estimate.estimateHigh,
    breakdown: estimate.breakdown,
    credits: {
      balance: credits.balance,
      available: credits.available,
      reserved: credits.reserved,
      monthlyGrant: credits.monthlyGrant,
    },
    aiTrial,
    useTrial,
    canProceed: useTrial || credits.available >= estimate.estimateHigh,
  });
}

export const POST = withSentryRoute("credits_estimate", postEstimate);

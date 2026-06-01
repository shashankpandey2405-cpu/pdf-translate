import { isAiToolSlug } from "@/server/ai/config";
import { getAiTrialSnapshot } from "@/server/ai/usageLimits";
import { estimateAiCredits, monthlyGrantCredits } from "@/server/credits/calculator";
import { getCreditBalance } from "@/server/credits/ledger";
import { AI_LIFETIME_TRIAL_LIMIT } from "@/server/ai/config";

export type AiPlusGateResult =
  | { ok: true; useTrial: boolean; estimateHigh: number; code?: string; message?: string; status?: number }
  | { ok: false; code: string; message: string; status: number };

/**
 * Server gate: AI Plus may run when the user has enough monthly credits
 * (or a legacy lifetime trial slot when AI_LIFETIME_TRIAL_LIMIT > 0).
 */
export async function assertCanRunAiPlus(params: {
  userId: string;
  toolSlug: string;
  pageCount: number;
  fileSizeBytes: number;
  isPremium: boolean;
}): Promise<AiPlusGateResult> {
  const { userId, toolSlug, pageCount, fileSizeBytes, isPremium } = params;

  if (!isAiToolSlug(toolSlug)) {
    return { ok: false, code: "unsupported_tool", message: "This tool does not support AI Plus.", status: 400 };
  }

  const estimate = estimateAiCredits({
    toolSlug,
    pageCount: Math.max(1, pageCount),
    fileSizeBytes,
    isPremium,
  });

  if (AI_LIFETIME_TRIAL_LIMIT > 0) {
    const aiTrial = await getAiTrialSnapshot(userId);
    if (aiTrial.trialRemaining > 0) {
      return { ok: true, useTrial: true, estimateHigh: estimate.estimateHigh };
    }
  }

  const credits = await getCreditBalance(userId, isPremium);
  if (credits.available >= estimate.estimateHigh) {
    return { ok: true, useTrial: false, estimateHigh: estimate.estimateHigh };
  }

  const monthly = monthlyGrantCredits(isPremium);
  return {
    ok: false,
    code: "INSUFFICIENT_CREDITS",
    message: isPremium
      ? `Need at least ${estimate.estimateHigh} AI credits (you have ${credits.available} available). Buy extra credits from Pricing.`
      : `Need at least ${estimate.estimateHigh} credits (you have ${credits.available} available). Free accounts receive ${monthly} credits each month after sign-in.`,
    status: 402,
  };
}

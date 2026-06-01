import { PRICING } from "@/lib/pricing/plans";
import { isAiToolSlug } from "@/server/ai/config";

export type CreditEstimateInput = {
  toolSlug: string;
  pageCount: number;
  totalChars?: number;
  fileSizeBytes?: number;
  isPremium?: boolean;
};

export type CreditEstimate = {
  estimate: number;
  estimateHigh: number;
  breakdown: {
    base: number;
    pageWeight: number;
    tokenWeight: number;
  };
};

/**
 * Base credits per tool (minimum charge).
 * OCR = 1/page, Summarize = 3, Translate = 5, Chat = 2
 * These are FIXED — same pricing on pricing page.
 */
function baseCreditsForTool(toolSlug: string): number {
  if (toolSlug === "translate-pdf") {
    return PRICING.creditCosts.find((c) => c.actionKey.includes("translate"))?.credits ?? 5;
  }
  if (toolSlug === "ai-summarize") {
    return PRICING.creditCosts.find((c) => c.actionKey.includes("summary"))?.credits ?? 3;
  }
  if (toolSlug === "chat-pdf") {
    return PRICING.creditCosts.find((c) => c.actionKey.includes("chat"))?.credits ?? 2;
  }
  if (toolSlug === "smart-scan-ai") {
    return PRICING.creditCosts.find((c) => c.actionKey.includes("scan"))?.credits ?? 4;
  }
  if (toolSlug === "ai-question-gen") {
    return 3;
  }
  if (toolSlug === "ai-rewrite-pdf") {
    return 3;
  }
  if (toolSlug === "ai-resume-builder") {
    return 4;
  }
  return 2;
}

/**
 * Pre-job credit estimate — reserves credits before AI runs.
 * No free model discount — user pays same regardless of which model runs.
 *
 * Pricing logic ($6.99 = 500 credits, must always be profitable):
 *   base + (pages-1)*0.5 + ceil(chars/4000)*0.5
 *
 * Examples:
 *   1 page summarize (~2500 chars) → 3 + 0 + 1 = 4 credits
 *   5 page summarize (~12500 chars) → 3 + 2 + 2 = 7 credits
 *   10 page translate (~25000 chars) → 5 + 4.5 + 4 = 14 credits
 *   100 page translate (~250000 chars) → 5 + 49.5 + 32 = 87 credits
 */
export function estimateAiCredits(input: CreditEstimateInput): CreditEstimate {
  const pages = Math.max(1, Math.min(input.pageCount, 100));
  const chars = input.totalChars ?? pages * 2500;

  const base = baseCreditsForTool(input.toolSlug);
  const pageWeight = Math.max(0, pages - 1) * 0.5;
  const tokenWeight = Math.ceil(chars / 4000) * 0.5;

  let estimate = Math.ceil(base + pageWeight + tokenWeight);
  estimate = Math.max(1, estimate);
  const estimateHigh = Math.ceil(estimate * 1.3);

  return {
    estimate,
    estimateHigh,
    breakdown: { base, pageWeight, tokenWeight },
  };
}

/**
 * Actual charge after job completes — uses REAL token counts.
 * No free model discount — same charge regardless of model.
 *
 * Formula: base + (tokens/1000)*0.3 + (pages-1)*0.25
 * Always at least 1 credit charged.
 */
const CLASSIC_MT_BASE = Number(process.env.CLASSIC_MT_BASE_CREDITS || "2") || 2;

/** Classic (open-source MT) — lower cost than AI translate. */
export function estimateClassicMtCredits(input: CreditEstimateInput): CreditEstimate {
  const pages = Math.max(1, Math.min(input.pageCount, 100));
  const base = CLASSIC_MT_BASE;
  const pageWeight = Math.max(0, pages - 1) * 0.25;
  const estimate = Math.max(1, Math.ceil(base + pageWeight));
  return {
    estimate,
    estimateHigh: Math.ceil(estimate * 1.15),
    breakdown: { base, pageWeight, tokenWeight: 0 },
  };
}

export function settleClassicMtCredits(input: { pageCount: number }): number {
  const pages = Math.max(1, input.pageCount);
  return Math.max(1, Math.ceil(CLASSIC_MT_BASE + Math.max(0, pages - 1) * 0.2));
}

export function settleAiCredits(input: {
  toolSlug: string;
  pageCount: number;
  promptTokens: number;
  completionTokens: number;
  modelId?: string;
}): number {
  const base = baseCreditsForTool(input.toolSlug);
  const tokenUnits = Math.ceil((input.promptTokens + input.completionTokens) / 1000);
  const pageWeight = Math.max(0, input.pageCount - 1) * 0.25;
  return Math.max(1, Math.ceil(base + tokenUnits * 0.3 + pageWeight));
}

export function monthlyGrantCredits(isPremium: boolean): number {
  return isPremium ? PRICING.premium.aiCreditsPerMonth : PRICING.free.aiCreditsPerMonth;
}

/** Trusted Cloud job cost for signed-in free users (AI tools use estimateAiCredits). */
export function cloudJobCreditCost(toolSlug: string): number {
  if (isAiToolSlug(toolSlug)) return 0;
  return 1;
}

import { AI_PLUS_MAX_FILE_BYTES } from "@/server/ai/config";
import {
  ENHANCED_AI_PAGE_LIMITS,
  ENHANCED_PREMIUM_MAX_FILE_BYTES,
  ENHANCED_PREMIUM_MAX_PAGES,
} from "@/server/enhanced/config";
import { estimateAiCredits, estimateClassicMtCredits } from "@/server/credits/calculator";

function estimateForTool(toolSlug: string, pageCount: number) {
  if (toolSlug === "translate-pdf") {
    return estimateClassicMtCredits({ toolSlug, pageCount, isPremium: false });
  }
  return estimateAiCredits({ toolSlug, pageCount, isPremium: false });
}

export function maxPagesAffordableWithCredits(
  toolSlug: string,
  creditAvailable: number,
  isPremium: boolean,
): number {
  if (isPremium) return ENHANCED_PREMIUM_MAX_PAGES;
  if (creditAvailable <= 0) return ENHANCED_AI_PAGE_LIMITS[toolSlug] ?? 2;

  let affordable = 1;
  for (let pages = 1; pages <= 100; pages += 1) {
    const est = estimateForTool(toolSlug, pages);
    if (creditAvailable >= est.estimateHigh) affordable = pages;
    else break;
  }
  return affordable;
}

export function maxAiFileBytesForUser(
  isPremium: boolean,
  creditAvailable: number,
  useTrial: boolean,
): number {
  if (isPremium) return ENHANCED_PREMIUM_MAX_FILE_BYTES;
  if (useTrial) return AI_PLUS_MAX_FILE_BYTES;
  if (creditAvailable >= 50) return AI_PLUS_MAX_FILE_BYTES;
  if (creditAvailable >= 15) return 8 * 1024 * 1024;
  return Math.min(AI_PLUS_MAX_FILE_BYTES, 5 * 1024 * 1024);
}

export function resolveAiPlusLimits(params: {
  toolSlug: string;
  isPremium: boolean;
  creditAvailable: number;
  useTrial: boolean;
}): { maxPages: number; maxFileBytes: number } {
  const { toolSlug, isPremium, creditAvailable, useTrial } = params;
  if (isPremium) {
    return {
      maxPages: ENHANCED_PREMIUM_MAX_PAGES,
      maxFileBytes: ENHANCED_PREMIUM_MAX_FILE_BYTES,
    };
  }
  if (useTrial) {
    return {
      maxPages: ENHANCED_AI_PAGE_LIMITS[toolSlug] ?? 2,
      maxFileBytes: AI_PLUS_MAX_FILE_BYTES,
    };
  }
  return {
    maxPages: maxPagesAffordableWithCredits(toolSlug, creditAvailable, false),
    maxFileBytes: maxAiFileBytesForUser(false, creditAvailable, false),
  };
}

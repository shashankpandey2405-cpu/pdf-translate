/** User-facing AI tier — never expose free/paid model names in UI. */

export type AiSummarizeTier = "standard" | "advanced";
export type SummaryLength = "short" | "medium" | "long";

export const SUMMARY_LENGTH_LABELS: Record<SummaryLength, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};

export const AI_TIER_COPY = {
  standard: {
    title: "Standard AI",
    subtitle: "Smaller model · best for simple PDFs · free limits",
    badge: "Free tier",
  },
  advanced: {
    title: "Advanced AI",
    subtitle: "Larger model · complex & longer PDFs · uses AI credits",
    badge: "Premium",
  },
} as const;

export function summaryMaxTokens(length: SummaryLength): number {
  if (length === "short") return 1200;
  if (length === "long") return 6000;
  return 3000;
}

/** Advanced tier needs Premium subscription + credits (enforced client + API). */
export function requiresPremiumForTier(tier: AiSummarizeTier): boolean {
  return tier === "advanced";
}

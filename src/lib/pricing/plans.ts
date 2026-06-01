/** Single source of truth for marketing pricing — USD only (no regional conversion). */

export type BillingCycle = "monthly" | "yearly";

export const BILLING_CURRENCY = "USD" as const;

export const PRICING = {
  premium: {
    monthlyUsd: 6.99,
    yearlyUsd: 69,
    aiCreditsPerMonth: 500,
  },
  free: {
    /** Refreshed on the 1st of each UTC month for signed-in free accounts (cloud + AI). */
    aiCreditsPerMonth: 10,
  },
  creditPacks: [
    { credits: 100, usd: 1.19 },
    { credits: 500, usd: 3.49 },
    { credits: 2000, usd: 11.99 },
  ] as const,
  creditCosts: [
    { actionKey: "pricingPage.credits.actions.ocrPage", credits: 1 },
    { actionKey: "pricingPage.credits.actions.summary", credits: 3 },
    { actionKey: "pricingPage.credits.actions.translate", credits: 5 },
    { actionKey: "pricingPage.credits.actions.chat", credits: 2 },
  ] as const,
} as const;

/** Always format as USD — e.g. $6.99 */
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function premiumPrice(cycle: BillingCycle): string {
  const p = PRICING.premium;
  return cycle === "yearly" ? formatUsd(p.yearlyUsd) : formatUsd(p.monthlyUsd);
}

export function creditPackPrice(usd: number): string {
  return formatUsd(usd);
}

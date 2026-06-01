/** Extra credit packs: subscribers only; purchase UI when balance is low. */

export const EXTRA_CREDITS_NEAR_EXHAUSTION = 10;

export const BILLING_CURRENCY = "USD" as const;

export function canPurchaseExtraCredits(isPremium: boolean): boolean {
  return isPremium;
}

export function shouldShowExtraCreditsPurchase(
  isPremium: boolean,
  availableCredits: number,
): boolean {
  if (!isPremium) return false;
  return availableCredits <= EXTRA_CREDITS_NEAR_EXHAUSTION;
}

export function extraCreditsPurchaseBlockedMessage(): string {
  return "An active Premium subscription is required to buy extra AI credits.";
}

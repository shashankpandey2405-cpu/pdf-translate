export type CheckoutProductId =
  | "premium_monthly"
  | "premium_yearly"
  | "credits_100"
  | "credits_500"
  | "credits_2000";

export const CHECKOUT_PRODUCT_IDS: CheckoutProductId[] = [
  "premium_monthly",
  "premium_yearly",
  "credits_100",
  "credits_500",
  "credits_2000",
];

export function isCheckoutProductId(value: unknown): value is CheckoutProductId {
  return typeof value === "string" && CHECKOUT_PRODUCT_IDS.includes(value as CheckoutProductId);
}

import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";
import { isCheckoutProductId } from "@/lib/pricing/checkoutProducts";
import { PRICING } from "@/lib/pricing/plans";
import { envString } from "@/server/env";

export type { CheckoutProductId };
export { isCheckoutProductId };

export type ProductConfig = {
  id: CheckoutProductId;
  kind: "subscription" | "credits";
  credits?: number;
  billingMonths?: number;
  billingYears?: number;
  paypalPlanEnvKey?: string;
};

const PRODUCTS: ProductConfig[] = [
  {
    id: "premium_monthly",
    kind: "subscription",
    billingMonths: 1,
    paypalPlanEnvKey: "PAYPAL_PLAN_PREMIUM_MONTHLY",
  },
  {
    id: "premium_yearly",
    kind: "subscription",
    billingYears: 1,
    paypalPlanEnvKey: "PAYPAL_PLAN_PREMIUM_YEARLY",
  },
  {
    id: "credits_100",
    kind: "credits",
    credits: PRICING.creditPacks[0].credits,
  },
  {
    id: "credits_500",
    kind: "credits",
    credits: PRICING.creditPacks[1].credits,
  },
  {
    id: "credits_2000",
    kind: "credits",
    credits: PRICING.creditPacks[2].credits,
  },
];

export function listCheckoutProducts(): ProductConfig[] {
  return PRODUCTS;
}

export function getCheckoutProduct(id: string): ProductConfig | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function paypalPlanIdForProduct(product: ProductConfig): string | null {
  if (!product.paypalPlanEnvKey) return null;
  return envString(product.paypalPlanEnvKey) || null;
}

export function isPayPalProductConfigured(product: ProductConfig): boolean {
  if (product.kind === "credits") return true;
  return Boolean(paypalPlanIdForProduct(product));
}

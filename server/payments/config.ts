import { envString } from "@/server/env";
import { isProductAuthOnly } from "@/server/productAuthOnly";
import { getAppEnv } from "@/server/types";
import { listCheckoutProducts, isPayPalProductConfigured } from "@/server/payments/catalog";
import { isPayPalCredentialsConfigured } from "@/server/payments/paypal/config";

export function isPaymentsEnabled(): boolean {
  if (isProductAuthOnly(getAppEnv())) return false;
  if (!isPayPalCredentialsConfigured()) return false;
  return listCheckoutProducts().some((p) => isPayPalProductConfigured(p));
}

export function appPublicUrl(): string {
  return (
    envString("NEXT_PUBLIC_APP_URL") ||
    envString("AUTH_URL") ||
    envString("NEXTAUTH_URL") ||
    "https://www.pdftrusted.com"
  ).replace(/\/$/, "");
}

export { isPayPalConfigured } from "@/server/payments/paypal/config";

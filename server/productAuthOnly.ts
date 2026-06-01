import type { AppEnv } from "./types";
import { envFlagFalse, envFlagTrue } from "./strings";
import { envString } from "./env";

function hasPayPalConfigured(): boolean {
  return Boolean(envString("PAYPAL_CLIENT_ID") && envString("PAYPAL_CLIENT_SECRET"));
}

/** Production launch: no paid checkout until PayPal + AUTH_ONLY_MODE=false. */
export function isProductAuthOnly(env: AppEnv): boolean {
  if (envFlagFalse(env.AUTH_ONLY_MODE)) return false;
  if (envFlagTrue(env.AUTH_ONLY_MODE)) return true;
  return !hasPayPalConfigured();
}

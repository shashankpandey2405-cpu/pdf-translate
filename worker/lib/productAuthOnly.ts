/**
 * Auth-only product mode: hide subscription flows while validating auth.
 * Set AUTH_ONLY_MODE=false when PayPal is configured for production checkout.
 */

import type { Env } from "../env";
import { envFlagFalse, envFlagTrue, val } from "../env";

function hasPayPalConfigured(env: Env & { PAYPAL_CLIENT_ID?: string; PAYPAL_CLIENT_SECRET?: string }): boolean {
  return Boolean(val(env.PAYPAL_CLIENT_ID) && val(env.PAYPAL_CLIENT_SECRET));
}

export function serverPaymentsConfigured(env: Env): boolean {
  return hasPayPalConfigured(env);
}

export function isProductAuthOnly(env: Env): boolean {
  if (envFlagFalse(env.AUTH_ONLY_MODE)) return false;
  if (envFlagTrue(env.AUTH_ONLY_MODE)) return true;
  return !serverPaymentsConfigured(env);
}

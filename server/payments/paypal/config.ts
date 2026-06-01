import { envString } from "@/server/env";

export function paypalMode(): "sandbox" | "live" {
  const mode = envString("PAYPAL_MODE", "sandbox").toLowerCase();
  return mode === "live" ? "live" : "sandbox";
}

export function paypalApiBase(): string {
  return paypalMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function paypalClientId(): string {
  return envString("PAYPAL_CLIENT_ID");
}

export function paypalClientSecret(): string {
  return envString("PAYPAL_CLIENT_SECRET");
}

export function paypalWebhookId(): string {
  return envString("PAYPAL_WEBHOOK_ID");
}

/** Client ID + secret — enough to start checkout (redirect to PayPal). */
export function isPayPalCredentialsConfigured(): boolean {
  return Boolean(paypalClientId() && paypalClientSecret());
}

/** Webhook recommended for reliable fulfillment; optional for first checkout test. */
export function isPayPalWebhookConfigured(): boolean {
  return Boolean(paypalWebhookId());
}

export function isPayPalConfigured(): boolean {
  return isPayPalCredentialsConfigured();
}

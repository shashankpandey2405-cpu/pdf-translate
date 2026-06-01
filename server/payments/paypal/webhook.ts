import { getPayPalAccessToken } from "@/server/payments/paypal/api";
import { isPayPalConfigured, paypalApiBase, paypalWebhookId } from "@/server/payments/paypal/config";
import {
  processPayPalFulfillment,
  processPayPalSubscriptionRevoked,
} from "@/server/payments/paypal/fulfillment";

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown> & {
    id?: string;
    custom_id?: string;
    status?: string;
    purchase_units?: Array<{ custom_id?: string }>;
    billing_info?: { next_billing_time?: string };
  };
};

function readCustomId(event: PayPalWebhookEvent): string | null {
  const resource = event.resource;
  if (!resource) return null;
  if (typeof resource.custom_id === "string") return resource.custom_id;
  const unit = resource.purchase_units?.[0];
  if (unit?.custom_id) return unit.custom_id;
  return null;
}

export async function verifyPayPalWebhook(req: Request, rawBody: string): Promise<boolean> {
  if (!isPayPalConfigured()) return false;

  const headers = {
    auth_algo: req.headers.get("paypal-auth-algo") ?? "",
    cert_url: req.headers.get("paypal-cert-url") ?? "",
    transmission_id: req.headers.get("paypal-transmission-id") ?? "",
    transmission_sig: req.headers.get("paypal-transmission-sig") ?? "",
    transmission_time: req.headers.get("paypal-transmission-time") ?? "",
  };

  if (Object.values(headers).some((v) => !v)) return false;

  try {
    const token = await getPayPalAccessToken();
    const res = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...headers,
        webhook_id: paypalWebhookId(),
        webhook_event: JSON.parse(rawBody),
      }),
    });
    const data = (await res.json()) as { verification_status?: string };
    return data.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[paypal-webhook] verify failed", err);
    return false;
  }
}

export async function handlePayPalWebhook(
  rawBody: string,
): Promise<{ ok: true; event: string } | { ok: false; status: number; error: string }> {
  if (!isPayPalConfigured()) {
    return { ok: false, status: 503, error: "webhook_not_configured" };
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }

  const eventType = event.event_type ?? "unknown";
  const externalId = `${event.id ?? eventType}:${String(event.resource?.id ?? "na")}`;
  const customId = readCustomId(event);
  const resource = event.resource;

  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    await processPayPalFulfillment({
      externalId,
      eventType,
      customId,
      payload: event,
      meta: { captureId: resource?.id },
    });
    return { ok: true, event: eventType };
  }

  if (
    eventType === "BILLING.SUBSCRIPTION.ACTIVATED" ||
    eventType === "BILLING.SUBSCRIPTION.RE-ACTIVATED" ||
    eventType === "BILLING.SUBSCRIPTION.UPDATED"
  ) {
    await processPayPalFulfillment({
      externalId,
      eventType,
      customId,
      payload: event,
      meta: {
        subscriptionId: resource?.id,
        renewsAt: resource?.billing_info?.next_billing_time ?? null,
        active: resource?.status === "ACTIVE",
      },
    });
    return { ok: true, event: eventType };
  }

  if (
    eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
    eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
    eventType === "BILLING.SUBSCRIPTION.SUSPENDED"
  ) {
    await processPayPalSubscriptionRevoked(
      externalId,
      eventType,
      customId,
      typeof resource?.billing_info?.next_billing_time === "string"
        ? resource.billing_info.next_billing_time
        : null,
      event,
    );
    return { ok: true, event: eventType };
  }

  return { ok: true, event: eventType };
}

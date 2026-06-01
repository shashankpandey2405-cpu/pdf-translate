import { PRICING } from "@/lib/pricing/plans";
import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";
import type { ProductConfig } from "@/server/payments/catalog";
import { encodeCheckoutCustomId } from "@/server/payments/customId";
import { appPublicUrl } from "@/server/payments/config";
import { findApproveLink, paypalApi } from "@/server/payments/paypal/api";

function creditPackUsd(productId: CheckoutProductId): string | null {
  const index = (["credits_100", "credits_500", "credits_2000"] as const).indexOf(
    productId as "credits_100" | "credits_500" | "credits_2000",
  );
  if (index < 0) return null;
  return PRICING.creditPacks[index].usd.toFixed(2);
}

function returnUrls() {
  const base = appPublicUrl();
  return {
    return_url: `${base}/api/checkout/paypal/return`,
    cancel_url: `${base}/pricing?checkout=cancelled`,
  };
}

export async function createPayPalOrderCheckout(opts: {
  userId: string;
  productId: CheckoutProductId;
  email?: string;
}): Promise<{ id: string; approveUrl: string }> {
  const amount = creditPackUsd(opts.productId);
  if (!amount) throw new Error("invalid_credit_product");

  const customId = encodeCheckoutCustomId(opts.userId, opts.productId);
  const urls = returnUrls();

  const order = await paypalApi<{
    id: string;
    links?: Array<{ rel?: string; href?: string }>;
  }>("/v2/checkout/orders", {
    method: "POST",
    json: {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: amount },
          custom_id: customId,
          description: `PdfTrusted AI credits — ${opts.productId.replace("credits_", "")}`,
        },
      ],
      application_context: {
        ...urls,
        brand_name: "PdfTrusted",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
      },
    },
  });

  const approveUrl = findApproveLink(order.links);
  if (!approveUrl) throw new Error("paypal_missing_approve_link");
  return { id: order.id, approveUrl };
}

export async function createPayPalSubscriptionCheckout(opts: {
  userId: string;
  product: ProductConfig;
  planId: string;
  email?: string;
}): Promise<{ id: string; approveUrl: string }> {
  const customId = encodeCheckoutCustomId(opts.userId, opts.product.id);
  const urls = returnUrls();

  const sub = await paypalApi<{
    id: string;
    links?: Array<{ rel?: string; href?: string }>;
  }>("/v1/billing/subscriptions", {
    method: "POST",
    json: {
      plan_id: opts.planId,
      custom_id: customId,
      subscriber: opts.email ? { email_address: opts.email } : undefined,
      application_context: {
        ...urls,
        brand_name: "PdfTrusted",
        user_action: "SUBSCRIBE_NOW",
      },
    },
  });

  const approveUrl = findApproveLink(sub.links);
  if (!approveUrl) throw new Error("paypal_missing_approve_link");
  return { id: sub.id, approveUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<void> {
  await paypalApi(`/v2/checkout/orders/${orderId}/capture`, { method: "POST", json: {} });
}

export async function fetchPayPalOrder(
  orderId: string,
): Promise<{ status?: string; purchase_units?: Array<{ custom_id?: string }> }> {
  return paypalApi(`/v2/checkout/orders/${orderId}`, { method: "GET" });
}

export async function fetchPayPalSubscription(subscriptionId: string): Promise<{
  status?: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string };
}> {
  return paypalApi(`/v1/billing/subscriptions/${subscriptionId}`, { method: "GET" });
}

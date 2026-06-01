import { getCheckoutProduct } from "@/server/payments/catalog";
import { decodeCheckoutCustomId } from "@/server/payments/customId";
import {
  applyCreditPackPurchase,
  applyPremiumSubscription,
  recordPaymentEvent,
  revokePremium,
} from "@/server/payments/entitlements";

export async function fulfillCheckoutProduct(
  userId: string,
  productId: string,
  meta: Record<string, unknown>,
): Promise<void> {
  const product = getCheckoutProduct(productId);
  if (!product) {
    console.warn("[paypal] unknown product", productId);
    return;
  }
  if (product.kind === "credits") {
    await applyCreditPackPurchase(userId, product, meta);
    return;
  }
  await applyPremiumSubscription(userId, {
    product,
    renewsAt: typeof meta.renewsAt === "string" ? meta.renewsAt : null,
    endsAt: typeof meta.endsAt === "string" ? meta.endsAt : null,
    active: meta.active !== false,
    meta,
  });
}

export async function processPayPalFulfillment(opts: {
  externalId: string;
  eventType: string;
  customId: string | null | undefined;
  payload: unknown;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const decoded = decodeCheckoutCustomId(opts.customId);
  if (!decoded) {
    console.warn("[paypal] missing custom_id", opts.eventType);
    return;
  }

  const recorded = await recordPaymentEvent({
    provider: "paypal",
    externalId: opts.externalId,
    eventType: opts.eventType,
    userId: decoded.userId,
    payload: opts.payload,
  });
  if (recorded === "duplicate") return;

  await fulfillCheckoutProduct(decoded.userId, decoded.productId, {
    provider: "paypal",
    event: opts.eventType,
    ...opts.meta,
  });
}

export async function processPayPalSubscriptionRevoked(
  externalId: string,
  eventType: string,
  customId: string | null | undefined,
  endsAt: string | null | undefined,
  payload: unknown,
): Promise<void> {
  const decoded = decodeCheckoutCustomId(customId);
  if (!decoded) return;

  const recorded = await recordPaymentEvent({
    provider: "paypal",
    externalId,
    eventType,
    userId: decoded.userId,
    payload,
  });
  if (recorded === "duplicate") return;

  await revokePremium(decoded.userId, endsAt ?? null);
}

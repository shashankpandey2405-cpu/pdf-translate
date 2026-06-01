import type { ProductConfig } from "@/server/payments/catalog";
import { paypalPlanIdForProduct } from "@/server/payments/catalog";
import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";
import {
  createPayPalOrderCheckout,
  createPayPalSubscriptionCheckout,
} from "@/server/payments/paypal/checkout";

export async function createPayPalCheckoutSession(opts: {
  product: ProductConfig;
  userId: string;
  email?: string;
}): Promise<{ url: string; paypalId: string } | null> {
  if (opts.product.kind === "credits") {
    const order = await createPayPalOrderCheckout({
      userId: opts.userId,
      productId: opts.product.id as CheckoutProductId,
      email: opts.email,
    });
    return { url: order.approveUrl, paypalId: order.id };
  }

  const planId = paypalPlanIdForProduct(opts.product);
  if (!planId) return null;

  const sub = await createPayPalSubscriptionCheckout({
    userId: opts.userId,
    product: opts.product,
    planId,
    email: opts.email,
  });
  return { url: sub.approveUrl, paypalId: sub.id };
}

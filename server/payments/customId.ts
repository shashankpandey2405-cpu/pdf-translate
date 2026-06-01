import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";
import { isCheckoutProductId } from "@/lib/pricing/checkoutProducts";

const SEP = "|";

export function encodeCheckoutCustomId(userId: string, productId: CheckoutProductId): string {
  return `${userId}${SEP}${productId}`;
}

export function decodeCheckoutCustomId(
  customId: string | undefined | null,
): { userId: string; productId: CheckoutProductId } | null {
  if (!customId || !customId.includes(SEP)) return null;
  const [userId, productId] = customId.split(SEP);
  if (!userId || !isCheckoutProductId(productId)) return null;
  return { userId, productId };
}

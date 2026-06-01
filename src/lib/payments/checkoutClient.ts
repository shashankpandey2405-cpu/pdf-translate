import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";

export async function startCheckout(product: CheckoutProductId): Promise<string> {
  const res = await fetch("/api/checkout/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message || data.error || "Checkout failed");
  }
  if (!data.url) throw new Error("Checkout URL missing");
  return data.url;
}

import { decodeCheckoutCustomId } from "@/server/payments/customId";
import { appPublicUrl } from "@/server/payments/config";
import {
  capturePayPalOrder,
  fetchPayPalOrder,
  fetchPayPalSubscription,
} from "@/server/payments/paypal/checkout";
import { processPayPalFulfillment } from "@/server/payments/paypal/fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(path: string): Response {
  return Response.redirect(`${appPublicUrl()}${path}`, 302);
}

/** PayPal return URL after approve — capture order if needed, then redirect user. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const subscriptionId = url.searchParams.get("subscription_id");

  try {
    if (token) {
      let order = await fetchPayPalOrder(token);
      if (order.status === "APPROVED") {
        await capturePayPalOrder(token);
        order = await fetchPayPalOrder(token);
      }
      const customId = order.purchase_units?.[0]?.custom_id;
      const decoded = decodeCheckoutCustomId(customId);
      if (decoded && (order.status === "COMPLETED" || order.status === "APPROVED")) {
        await processPayPalFulfillment({
          externalId: `return:${token}`,
          eventType: "CHECKOUT.RETURN",
          customId,
          payload: { orderId: token, status: order.status },
          meta: { source: "return_url" },
        }).catch(() => {});
      }
      return redirect("/pricing?checkout=success");
    }

    if (subscriptionId) {
      const sub = await fetchPayPalSubscription(subscriptionId);
      if (sub.status === "ACTIVE") {
        await processPayPalFulfillment({
          externalId: `return:${subscriptionId}`,
          eventType: "SUBSCRIPTION.RETURN",
          customId: sub.custom_id,
          payload: { subscriptionId, status: sub.status },
          meta: {
            subscriptionId,
            renewsAt: sub.billing_info?.next_billing_time ?? null,
            active: true,
            source: "return_url",
          },
        }).catch(() => {});
      }
      return redirect("/pricing?checkout=success");
    }
  } catch (err) {
    console.error("[checkout/paypal/return]", err);
    return redirect("/pricing?checkout=error");
  }

  return redirect("/pricing?checkout=cancelled");
}

import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { handlePayPalWebhook, verifyPayPalWebhook } from "@/server/payments/paypal/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postPayPalWebhook(req: Request) {
  const rawBody = await req.text();

  if (!(await verifyPayPalWebhook(req, rawBody))) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  const result = await handlePayPalWebhook(rawBody);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, event: result.event });
}

export const POST = withSentryRoute("webhook_paypal", postPayPalWebhook);

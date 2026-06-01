import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { isCheckoutProductId, getCheckoutProduct } from "@/server/payments/catalog";
import { createPayPalCheckoutSession } from "@/server/payments/checkout";
import { isPaymentsEnabled } from "@/server/payments/config";
import { isPayPalCredentialsConfigured } from "@/server/payments/paypal/config";
import { paypalPlanIdForProduct } from "@/server/payments/catalog";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { getAppEnv } from "@/server/types";
import {
  canPurchaseExtraCredits,
  extraCreditsPurchaseBlockedMessage,
  BILLING_CURRENCY,
} from "@/lib/billing/extraCreditsPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postCheckoutSession(req: Request) {
  if (!isPayPalCredentialsConfigured()) {
    return Response.json(
      {
        error: "payments_disabled",
        message: "PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server.",
      },
      { status: 503 },
    );
  }

  if (!isPaymentsEnabled()) {
    return Response.json(
      {
        error: "payments_disabled",
        message:
          "PayPal checkout is not fully configured. For subscriptions, set PAYPAL_PLAN_PREMIUM_MONTHLY and PAYPAL_PLAN_PREMIUM_YEARLY.",
      },
      { status: 503 },
    );
  }

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: { product?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isCheckoutProductId(body.product)) {
    return Response.json({ error: "invalid_product" }, { status: 400 });
  }

  const product = getCheckoutProduct(body.product);
  if (!product) {
    return Response.json({ error: "invalid_product" }, { status: 400 });
  }

  if (product.kind === "credits") {
    const env = getAppEnv();
    const isPremium = await resolveIsPremium(req, env);
    if (!canPurchaseExtraCredits(isPremium)) {
      return Response.json(
        {
          error: "subscription_required",
          message: extraCreditsPurchaseBlockedMessage(),
          currency: BILLING_CURRENCY,
        },
        { status: 403 },
      );
    }
  }

  try {
    const session = await createPayPalCheckoutSession({
      product,
      userId: user.id,
      email: user.email,
    });
    if (!session) {
      const planMissing =
        product.kind === "subscription" && !paypalPlanIdForProduct(product);
      return Response.json(
        {
          error: "checkout_not_configured",
          message: planMissing
            ? "PayPal subscription plan ID is missing. Add PAYPAL_PLAN_PREMIUM_MONTHLY or PAYPAL_PLAN_PREMIUM_YEARLY in Vercel."
            : "PayPal checkout could not be created. Verify sandbox credentials and redeploy.",
        },
        { status: 503 },
      );
    }
    return Response.json({ url: session.url, product: product.id, paypalId: session.paypalId });
  } catch (err) {
    console.error("[checkout/session]", err);
    return Response.json(
      { error: "checkout_failed", message: err instanceof Error ? err.message : "PayPal error" },
      { status: 502 },
    );
  }
}

export const POST = withSentryRoute("checkout_session", postCheckoutSession);

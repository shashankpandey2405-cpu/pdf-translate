# Phase 4 — Billing (PayPal only)

PdfTrusted uses **PayPal only** for Premium subscriptions and AI credit packs (no Paddle).

## Products

| Product ID | Type | PayPal setup |
|------------|------|--------------|
| `premium_monthly` | Subscription | `PAYPAL_PLAN_PREMIUM_MONTHLY` |
| `premium_yearly` | Subscription | `PAYPAL_PLAN_PREMIUM_YEARLY` |
| `credits_100` / `500` / `2000` | One-time order | USD price from `src/lib/pricing/plans.ts` |

## Env vars

```env
AUTH_ONLY_MODE=false
VITE_AUTH_ONLY_MODE=false
NEXT_PUBLIC_PAYMENTS_ENABLED=true
VITE_PAYMENTS_ENABLED=true

PAYPAL_MODE=sandbox          # or live
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_PLAN_PREMIUM_MONTHLY=
PAYPAL_PLAN_PREMIUM_YEARLY=
```

## PayPal Dashboard

1. Create **Subscription plans** (monthly + yearly) → copy Plan IDs.
2. Create **Webhook** → `https://www.pdftrusted.com/api/webhooks/paypal`
3. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
4. Copy **Webhook ID** → `PAYPAL_WEBHOOK_ID`

## Flow

1. `CheckoutButton` → `POST /api/checkout/session` → PayPal approve URL
2. User pays → webhook + `/api/checkout/paypal/return` (backup)
3. `custom_id` = `{userId}|{productId}` → credits or `profiles.is_premium`

See **docs/FINAL_GO_LIVE.md** for full platform checklist.

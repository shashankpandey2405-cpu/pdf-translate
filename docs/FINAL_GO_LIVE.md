# PdfTrusted — Final go-live checklist

All platform phases (1–4) are implemented in code. Complete these steps **in order** to go live.

---

## Phase 1 — Scale + OpenRouter ✅ (code done)

- [ ] Verify `OPENROUTER_API_KEY` on Vercel + Railway
- [ ] Trial limits: `AI_LIFETIME_TRIAL_LIMIT=1`, `ENHANCED_DAILY_LIMIT=2`, `ENHANCED_TRIAL_MAX_FILE_MB=15`, `ENHANCED_TRIAL_MAX_PAGES=10`

---

## Phase 2 — Credit ledger ✅ (code done)

Run in **Supabase SQL editor**:

1. `supabase/migrations/001_credit_ledger.sql`
2. `supabase/migrations/002_payment_events.sql`

Verify: signed-in user → `GET /api/credits/balance` returns balance.

---

## Phase 3 — Railway AI worker ✅ (code done)

**Vercel env:**

```env
AI_WORKER_RUNTIME=railway
RAILWAY_AI_WORKER_PING_URL=https://<railway-service>/api/internal/ai-worker-ping
RAILWAY_AI_WORKER_SECRET=<shared-secret>
```

**Railway service:**

- Start command: `npm run worker:ai`
- Config: `railway.ai.toml`
- Same env as Vercel: Redis, OpenRouter, R2, Supabase

Test: enqueue AI job → Railway logs `[ai-worker] processed=1`.

---

## Phase 4 — PayPal billing ✅ (code done)

**PayPal Dashboard (sandbox first):**

1. REST app → Client ID + Secret
2. Subscription plans → monthly + yearly Plan IDs
3. Webhook → `https://www.pdftrusted.com/api/webhooks/paypal`
4. Events: `PAYMENT.CAPTURE.COMPLETED`, `BILLING.SUBSCRIPTION.*`

**Vercel env:**

```env
AUTH_ONLY_MODE=false
VITE_AUTH_ONLY_MODE=false
NEXT_PUBLIC_PAYMENTS_ENABLED=true
VITE_PAYMENTS_ENABLED=true

PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_PLAN_PREMIUM_MONTHLY=
PAYPAL_PLAN_PREMIUM_YEARLY=
```

**Test flow:**

1. Pricing → Buy 100 credits (sandbox PayPal account)
2. Webhook fires → credits in `/api/credits/balance`
3. AI Summarize → job completes with credit settle

Switch `PAYPAL_MODE=live` when ready.

---

## Deploy

```bash
npm run build
vercel --prod
```

Railway: redeploy AI worker after env changes.

---

## Rollback

| Issue | Action |
|-------|--------|
| Payments broken | `AUTH_ONLY_MODE=true` |
| AI queue stuck | `AI_QUEUE_DRAIN_ON_VERCEL=true` (temporary) |
| Credits wrong | Check Supabase `credit_transactions` + `payment_events` |

---

## Removed

- **Lemon Squeezy** — fully removed; use PayPal only.

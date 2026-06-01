# Railway AI worker

Long-running consumer for the `ai` Redis queue. Vercel enqueues jobs; this service drains them via OpenRouter.

## Deploy

1. Create a **new Railway service** from this repo (same branch as production).
2. Set **Config file** to `railway.ai.toml` or copy its `startCommand`.
3. Copy env from Vercel / `.env.local`:
   - `REDIS_URL` (or Upstash REST + ioredis URL)
   - `OPENROUTER_API_KEY` and OpenRouter model vars
   - `S3_*` / R2 keys (job input download)
   - `SUPABASE_*` (credit ledger settle/release)
   - `AI_WORKER_RUNTIME=railway` (on **Vercel**, not required on Railway)
4. On **Vercel**, set:
   - `AI_WORKER_RUNTIME=railway`
   - `RAILWAY_AI_WORKER_PING_URL=https://<your-railway-service>/api/internal/ai-worker-ping` (optional wake)
   - `RAILWAY_AI_WORKER_SECRET=<same as Railway>` (recommended)
5. Run Supabase migration `supabase/migrations/001_credit_ledger.sql` if not done.

## Local

```bash
npm install
npm run worker:ai
```

For local full stack with Vercel draining instead:

```env
AI_QUEUE_DRAIN_ON_VERCEL=true
AI_WORKER_RUNTIME=vercel
```

## Health

- `GET/POST /api/internal/ai-worker-ping` — processes one job when authorized (Bearer or `x-worker-secret`).
- `POST /api/internal/ai-process` — returns `503 ai_worker_on_railway` when Vercel drain is disabled.

## PayPal

Billing uses PayPal on the Next.js app (`/api/webhooks/paypal`). See `docs/FINAL_GO_LIVE.md`.

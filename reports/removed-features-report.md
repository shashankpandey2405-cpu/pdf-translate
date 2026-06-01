# Removed features report

Generated: 2026-05-18

## Payments (Stripe / Lemon Squeezy)
- Checkout route, webhooks, `PricingCtaButton`, `paymentsConfig`
- Product mode: **auth + 2 free enhanced jobs/day** (no paid checkout)

## AI experiments
- `chat-pdf` route removed; slug in `COMING_SOON_TOOL_SLUGS`
- Gemini client, `PremiumFeatureLock`, chat-pdf SEO bundle

## Legacy infrastructure
- Cloudflare `worker/` directory (duplicate of Next `app/api`)
- Auth.js session stack → Supabase-only; `/api/auth/*` returns 410
- `@auth/core` dependency removed

## Frontend dedup
- `HomeToolGrid`, `chart.tsx` + recharts
- Production `agentLog` calls removed from tool shells / enhanced client

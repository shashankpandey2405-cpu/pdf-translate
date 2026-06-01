# Cleaned environment report

Generated: 2026-05-18

## Removed from .env.example
- Stripe (`STRIPE_*`, `VITE_STRIPE_*`)
- Lemon Squeezy (`LEMONSQUEEZY_*`, `VITE_LEMONSQUEEZY_*`)
- OpenAI, Gemini, Cloudflare AI trial keys
- Legacy Auth.js OAuth block (optional `LEGACY_AUTH_ENABLED=false` only)

## Required production
See `.env.example` sections 1–3: Supabase, R2/S3, Upstash, `RENDER_WORKER_SECRET`, `ENHANCED_CALLBACK_URL`, `NEXT_PUBLIC_ENHANCED_ENABLED`, `NEXT_PUBLIC_APP_URL`.

# PDFTrusted — Production Infrastructure Audit

**Generated:** 2026-05-18T08:21:00.891Z

> No secret values in this document — environment variable **names** only.

## Executive summary

| Metric | Value |
|--------|-------|
| **Launch readiness score** | **80 / 100** |
| Tool routes (last matrix) | 38/38 |
| Critical env missing (local) | 0 |
| SEO stale hits | 0 |
| Vercel crons | /api/cron/r2-staging-purge @ 0 0 * * * |

---

## 1. Critical blockers

| ID | Issue | Action |
|----|-------|--------|
| B-01 | URL alignment | Verify on production deploy |
| B-02 | Cloud E2E not proven in CI | Set `QA_SESSION_COOKIE`, run `npm run qa:jobs-pools` on staging |
| B-03 | R2 CORS | Allow PUT/GET from production + staging origins in Cloudflare dashboard |
| B-04 | Supabase OAuth redirects | Add production `/auth/callback` to allow list |

## 2. Production blockers

- Manual Premium job per pool (compress, docx, ocr) on staging
- `vercel --prod` after `node scripts/validate-vercel-cron.mjs`
- Physical mobile upload test (iOS Safari, Android Chrome)

## 3. Security risks

| Risk | Mitigation |
|------|------------|
| `PDFTRUSTED_QA_MODE` on production | Blocked by `next.config.mjs`; run `npm run qa:assert-prod` |
| Worker callback forgery | `x-worker-secret` + output key prefix validation |
| Service role in client | Only `NEXT_PUBLIC_*` in browser bundles |
| RPOP job loss on worker crash | Callback retries; poll-time stuck failure; daily cron sweeper |

## 4. Missing env vars (local audit)

_All critical keys SET in loaded environment._

## 5. Environment matrix (full catalog)

| Variable | Purpose | Primary file | Vercel | Render | Prod required | Status |
|----------|---------|--------------|--------|--------|---------------|--------|
| `NEXT_PUBLIC_APP_URL` | Canonical site origin for OAuth, SEO, health fallbacks | server/appUrl.ts | Yes | — | Yes | **SET** |
| `ENHANCED_CALLBACK_URL` | Next.js base URL for Render worker callbacks | backend-service/app/callback.py | Yes | Yes | Yes | **SET** |
| `NEXT_PUBLIC_ENHANCED_ENABLED` | Enable Premium/Normal hybrid UI and cloud APIs | src/lib/featureFlags.ts | Yes | — | Yes | **SET** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser + server) | src/lib/supabase/ | Yes | — | Yes | **SET** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser only) | src/lib/supabase/client.ts | Yes | — | Yes | **SET** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase admin (jobs, usage) — never expose to c… | lib/supabase/admin.ts | Yes | — | Yes | **SET** |
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint for queues and rate limits | server/enhanced/redis.ts | Yes | Yes | Yes | **SET** |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST auth token | server/enhanced/redis.ts | Yes | Yes | Yes | **SET** |
| `S3_ENDPOINT` | Cloudflare R2 S3-compatible endpoint | server/s3.ts | Yes | Yes | Yes | **SET** |
| `S3_REGION` | R2 region (often auto) | server/s3.ts | Yes | Yes | Yes | **SET** |
| `S3_BUCKET` | R2 bucket name | server/s3.ts | Yes | Yes | Yes | **SET** |
| `S3_ACCESS_KEY_ID` | R2 access key | server/s3.ts | Yes | Yes | Yes | **SET** |
| `S3_SECRET_ACCESS_KEY` | R2 secret key | server/s3.ts | Yes | Yes | Yes | **SET** |
| `RENDER_WORKER_SECRET` | Shared secret for worker callback header x-worker-secret | app/api/enhanced/worker/callback/route.ts | Yes | Yes | Yes | **SET** |
| `ENHANCED_DAILY_LIMIT` | Free Premium cloud jobs per user per UTC day | server/enhanced/config.ts | Yes | — | Yes | **SET** |
| `ENHANCED_IP_DAILY_LIMIT` | Per-IP cloud abuse cap (default 20) | server/enhanced/rateLimits.ts | Yes | — | Optional | **MISSING** |
| `ENHANCED_QUEUE_MAX_DEPTH` | Max queue depth before 503 QUEUE_BUSY | server/enhanced/config.ts | Yes | — | Optional | **SET** |
| `CRON_SECRET` | Optional Bearer auth for manual cron triggers | app/api/cron/r2-staging-purge/route.ts | Yes | — | Optional | **MISSING** |
| `WORKER_POOL` | Render worker pool: ocr | docx | compress | backend-service/app/queue/consumer.py | — | Yes | — | **MISSING** |
| `PDFTRUSTED_QA_MODE` | Dev/staging QA bypass for limits — NEVER on Vercel Productio… | server/qa/isQaMode.ts | — | — | — | **MISSING** |
| `NEXT_PUBLIC_PDFTRUSTED_QA_MODE` | Client-side QA flag mirror | src/lib/qa/isQaMode.ts | — | — | — | **MISSING** |
| `LEGACY_AUTH_ENABLED` | Legacy Auth.js routes — keep false for Supabase-only | app/api/auth/[...slug]/route.ts | — | — | Optional | **SET** |
| `AUTH_SECRET` | NextAuth/Auth.js secret (legacy) | .env.example | — | — | Optional | **SET** |
| `NEXTAUTH_URL` | Fallback app URL for auth | server/appUrl.ts | — | — | Optional | **SET** |

## 6. Vercel checklist

### Production

- [ ] `NEXT_PUBLIC_APP_URL` = production origin
- [ ] `ENHANCED_CALLBACK_URL` = same origin
- [ ] Single cron: `0 0 * * *` → `/api/cron/r2-staging-purge`
- [ ] `CRON_SECRET` optional
- [ ] Never `PDFTRUSTED_QA_MODE` on Production
- [ ] `npm run build` succeeds

### Preview

- [ ] Preview URL in Supabase redirects
- [ ] `ENHANCED_CALLBACK_URL` = preview deployment URL for worker tests

See [docs/VERCEL-CRON.md](../docs/VERCEL-CRON.md).

## 7. Render checklist

- [ ] Three workers: ocr, docx, compress (`backend-service/render.yaml`)
- [ ] Health web: `GET /health`
- [ ] Same Redis, R2, `RENDER_WORKER_SECRET`, `ENHANCED_CALLBACK_URL` as Vercel
- [ ] `npm run worker:health` against Render health URL

## 8. Supabase checklist

- [ ] Site URL = `NEXT_PUBLIC_APP_URL`
- [ ] Redirect: `{APP_URL}/auth/callback`
- [ ] Migration `002_hybrid_processing.sql` applied
- [ ] Tables: `processing_jobs`, `user_usage`
- [ ] RLS: users read own rows; writes via service role

## 9. R2 checklist

- [ ] CORS: localhost, staging, `https://www.pdftrusted.com`
- [ ] Prefixes: `enhanced/input/{userId}/`, `enhanced/output/{userId}/`
- [ ] 24h purge via daily cron + `purgeExpiredStagedObjects`
- [ ] Presigned PUT/GET TTL: 900s

## 10. Redis checklist

- [ ] Queues: `enhanced:queue:ocr`, `docx`, `compress`
- [ ] `ENHANCED_QUEUE_MAX_DEPTH` (default 50)
- [ ] `reserveEnhancedJobSlot` for daily quota races

## 11. Tool matrix status

- **38/38** routes OK (see `reports/tool-matrix.json`)
- Cloud tools: compress-pdf, pdf-to-word, ocr-pdf

## 12. Mobile / PWA readiness

- Playwright: `mobile-chrome`, `mobile-safari` in `playwright.config.ts`
- PWA: `public/manifest.webmanifest` (hybrid messaging)
- Manual: install prompt, upload, drawer, keyboard — **required before launch**

## 13. SEO readiness

Automated seo-scan: **0 hits** on primary targets

## 14. Performance status

- Heavy deps: fabric, mupdf, pdfjs, opencv, tesseract — lazy-load roadmap
- Session refresh debounced 800ms in PremiumContext
- Target Lighthouse 90+ mobile (manual run)

## 15. Cloud E2E status

Flow: presign → R2 PUT → POST jobs → Redis → Render → callback → poll → download

- Automated: `tests/api/jobs-lifecycle.test.mjs`, `npm run qa:jobs-pools`
- Requires: `QA_SESSION_COOKIE`, workers running, matching callback URL

## 16. Safe-to-deploy checklist

- [x] Hobby cron: single daily schedule
- [x] Cron validator in predeploy
- [ ] Staging cloud E2E green
- [ ] Production env matrix SET on Vercel
- [ ] R2 CORS + Supabase redirects

## 17. Must-fix-before-production

- [ ] B-01 through B-04 above
- [ ] Launch score ≥ 75/100
- [ ] 38/38 tool matrix on staging

## 18. Launch roadmap

1. Staging E2E all pools
2. Production env + deploy
3. Post-deploy smoke: health, one Premium job, OAuth
4. Lighthouse + mobile devices
5. Monitor queue depth + worker logs

## 19. Scaling roadmap

- Vercel Pro: optional hourly cron
- Queue v2: BRPOPLPUSH + DLQ
- Scale Render workers per pool
- CDN for static assets

## 20. Cost optimization

- Daily cron reduces Vercel invocations (Hobby)
- R2 24h lifecycle limits storage
- Upstash Redis serverless pay-per-request
- Three dedicated worker services — right-size Render plans after metrics

## Launch score breakdown

| Gate | OK | Points |
|------|-----|--------|
| Critical env (local audit) | yes | 15 |
| Vercel Hobby cron valid | yes | 10 |
| URL alignment | yes | 10 |
| Tool matrix 38/38 | yes | 15 |
| SEO scan clean | yes | 8 |
| QA bypass prod guard | yes | 7 |
| Cloud hardening (presign quota, callback retry) | yes | 10 |
| Stuck job poll recovery | yes | 5 |
| Manual cloud E2E on staging | no | 10 |
| R2 CORS production verified | no | 5 |
| Physical mobile smoke | no | 5 |

---

Related: [final-production-audit.md](./final-production-audit.md), [DEPLOY-ENV.md](../docs/DEPLOY-ENV.md)

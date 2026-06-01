# PdfTrusted — 360° Platform Audit Report

**Generated:** 2026-05-20  
**Scope:** All tools, pipelines, AI/credits, auth, payments, infra (Vercel / Railway / Supabase / R2)  
**Code status:** Phases 1–4 implemented in repo; production deploy steps below.

---

## Executive summary

| Area | Status | Notes |
|------|--------|-------|
| **40 catalog tools** | ✅ Live routes | 15+ lack desktop `MasterToolWorkspace` (mobile layout on desktop) |
| **AI (OpenRouter)** | ✅ Code complete | Railway worker drains `ai` queue |
| **Credits + PayPal** | ✅ Code complete | Migrations + PayPal dashboard setup required |
| **Google auth** | ✅ Supabase OAuth | Not legacy Auth.js |
| **Python workers** | ⚠️ External repo | `backend-service/` not in this workspace |
| **Supabase schema** | ⚠️ Partial | Only credit/payment migrations in repo |

**Fixes applied in this audit:**
- Translate PDF: desktop `AiToolDesktopAdapter`, sign-in, PLATFORM limits (15 MB / 10 pages)
- MasterToolWorkspace: right panel visible at `lg` (was `xl` only)
- `canUse()` slug passed on split, watermark, extract, rotate, page-numbers, remove, organize, universal-converter

---

## 1. Infrastructure — kya kahan chalta hai

### Vercel (Next.js 15)

**Role:** Frontend, auth session, all `/api/*` routes, cron, PayPal webhooks, job orchestration.

| Category | Routes |
|----------|--------|
| Health | `/api/health`, `/api/enhanced/health` |
| Auth | `/api/session`, `/auth/callback` (Supabase) |
| Cloud jobs | `/api/enhanced/presign`, `/api/enhanced/jobs`, download, usage |
| Credits | `/api/credits/balance`, `/api/credits/estimate` |
| PayPal | `/api/checkout/session`, `/api/checkout/paypal/return`, `/api/webhooks/paypal` |
| AI backup | `/api/internal/ai-process`, `/api/internal/ai-worker-ping` |
| R2 staging | `/api/r2/*`, `/api/multipart/*` |
| Cron | `/api/cron/r2-staging-purge` |

**Required env (Vercel):**
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
REDIS_URL
S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
OPENROUTER_API_KEY + OPENROUTER_MODEL_* 
AI_WORKER_RUNTIME=railway
AUTH_ONLY_MODE=false (when payments live)
PAYPAL_* (see Phase 4)
NEXT_PUBLIC_ENHANCED_ENABLED=true
CRON_SECRET
```

### Railway

| Service | Command | Drains |
|---------|---------|--------|
| **AI worker (Node)** — in repo | `npm run worker:ai` | Redis pool `ai` |
| **Python workers** — external `backend-service` | `python -m app.queue.consumer {pool}` | `ocr`, `docx`, `compress`, `excel`, `office`, `security`, `convert` |

**Railway AI worker env:** same as Vercel for Redis, OpenRouter, S3, Supabase.

**Railway Python (per service):** `WORKER_POOL=ocr|docx|...`, `REDIS_URL`, `S3_*`, `RENDER_WORKER_SECRET`, `ENHANCED_CALLBACK_URL`.

### Supabase

| Table | Migration in repo? | Purpose |
|-------|-------------------|---------|
| `credit_accounts`, `credit_holds`, `credit_transactions` | ✅ `001` | AI credit ledger |
| `payment_events` | ✅ `002` | PayPal idempotency |
| `profiles` | ❌ | `is_premium`, `premium_until` |
| `processing_jobs` | ❌ | Cloud job status |
| `user_usage*` | ❌ | Daily quotas |
| `login_events`, `job_trace_events` | ❌ | Audit/trace |

**Auth:** Google OAuth configured in Supabase Dashboard (not `AUTH_GOOGLE_*` on Vercel).

**Run in SQL editor:** `001_credit_ledger.sql`, `002_payment_events.sql` + base schema from your existing Supabase project.

### Cloudflare R2

**Access:** S3-compatible API (`S3_*` env vars).

| Prefix | Use |
|--------|-----|
| `enhanced/input/{userId}/{jobId}-*.pdf` | Cloud job input |
| `enhanced/output/{userId}/{jobId}.ext` | Worker output |
| `staging/`, `uploads/` | Large uploads; cron purge |

**Dashboard:** CORS for `https://www.pdftrusted.com`, API token → `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`.

---

## 2. Processing pipelines

```
User upload
  → Browser tool (pdf-lib, pdfjs) OR
  → POST /api/enhanced/presign → R2 PUT
  → POST /api/enhanced/jobs → Supabase job + Redis LPUSH

Redis queue (priority: premium → default → free)
  → Python worker (pool) OR Node AI worker (pool=ai)
  → R2 output + POST /api/enhanced/worker/callback

AI pool only:
  → OpenRouter (free models for small jobs, paid fallback)
  → reserve credits → settle/release
```

### Queue pools

| Pool | Worker | Example tools |
|------|--------|---------------|
| `ocr` | Python | ocr-pdf |
| `docx` | Python | pdf-to-word |
| `compress` | Python | compress-pdf |
| `excel` | Python | pdf-to-excel |
| `office` | Python | word-to-pdf, pptx-to-pdf |
| `security` | Python | protect, unlock, redact |
| `convert` | Python | pdf-to-image, pdf-to-pptx |
| `ai` | Railway Node | translate-pdf, ai-summarize |

---

## 3. Limits — free vs premium vs AI

### Cloud (signed-in, enhanced)

| Tier | Daily jobs | Max file | Max pages |
|------|------------|----------|-----------|
| Free | 2/day | 15 MB | 10 |
| Premium | Higher | 500 MB | 100 |

### AI Plus (translate, summarize)

| Rule | Value |
|------|-------|
| Lifetime trial | **1 per account** (any AI tool) |
| After trial | **AI credits** (PayPal packs) or Premium monthly grant |
| Trial caps | 15 MB, 10 pages (`documentScale.ts`) |
| Small job routing | ≤2 pages, ≤10k chars → OpenRouter **free** models first |
| Large jobs | Paid OpenRouter models; credits reserved before job |

### Browser-only tools

No cloud quota; device/tier caps via `canUse(slug)` + `localBrowserTools.ts` (merge, split, editor, sign, etc.).

### Sign-in

| When | Behavior |
|------|----------|
| Cloud / AI | Sign in required; stash file + restore after OAuth |
| Browser-only | Usually no sign-in |
| PayPal checkout | Sign in required before `/api/checkout/session` |

---

## 4. Tool-by-tool matrix (40 tools)

**Legend:** Desktop = `MasterToolWorkspace` at lg+. M = Mobile layout.

| Tool | Desktop | Sign-in | Cloud | AI modes | Status |
|------|---------|---------|-------|----------|--------|
| compress-pdf | ✅ | Cloud | Hybrid | — | OK |
| pdf-editor | ✅ custom | Optional | Browser | — | OK |
| translate-pdf | ✅ fixed | ✅ | Hybrid | Browser/OCR/AI | **Fixed this audit** |
| ai-summarize | ✅ | ✅ | — | AI Plus | OK |
| ocr-pdf | ✅ shell | ✅ | Cloud only | — | OK |
| merge-pdf | M | Optional | Browser | — | No desktop UI |
| split-pdf | M | Optional | Browser | — | canUse slug fixed |
| pdf-to-word | ✅ | ✅ | Hybrid | — | Browser=RTF note |
| pdf-to-image | M | ✅ | Hybrid | — | No desktop UI |
| word-to-pdf | M | ✅ | Cloud | — | No desktop UI |
| protect/unlock/redact | ✅ shell | ✅ | Hybrid | — | OK |
| watermark-pdf | ✅ | Optional | Browser | — | canUse fixed |
| sign-pdf | Custom lg | Optional | Browser | — | OK |
| rotate/extract/remove/organize/page-numbers | M | Optional | Browser | — | canUse fixed |
| ToolPage catch-all (7 slugs) | ✅ Generic | ✅ | Varies | — | OK |
| universal-converter, qr, scanner, etc. | M | Varies | Browser | — | Lower priority desktop |

**Coming soon:** none in catalog (`COMING_SOON_TOOL_SLUGS` empty).

---

## 5. Auth flow (Google)

1. User → Supabase `signInWithOAuth({ provider: 'google' })`
2. Redirect → `/auth/callback` → session cookies
3. `/api/session` → user + `isPremium` from `profiles`
4. **Legacy** `/api/auth/*` → 410 (Auth.js removed)
5. **Legacy** `/api/account-*` → R2 email/password (parallel path; prefer Supabase)

**Supabase Dashboard:** Google provider + redirect URLs for production domain.

---

## 6. PayPal flow (only payment provider)

1. `CheckoutButton` → `POST /api/checkout/session` `{ product }`
2. Products: `premium_monthly`, `premium_yearly`, `credits_100|500|2000`
3. PayPal approve URL → user pays
4. Webhook `POST /api/webhooks/paypal` → credits or `profiles.is_premium`
5. Return URL `/api/checkout/paypal/return` (backup fulfill)

**Lemon Squeezy:** removed.

---

## 7. OpenRouter / AI worker

| Setting | Purpose |
|---------|---------|
| `OPENROUTER_API_KEY` | Required |
| `OPENROUTER_MODEL_FREE` | Small jobs |
| `OPENROUTER_FALLBACK_MODELS` | On failure |
| `AI_WORKER_RUNTIME=railway` | Vercel does not drain AI queue |
| `npm run worker:ai` on Railway | Primary consumer |

---

## 8. Known gaps (not fixed — backlog)

| Priority | Issue |
|----------|-------|
| P0 | `backend-service/` Python workers not in repo — deploy separately |
| P0 | Base Supabase tables not in migrations folder |
| P1 | 15 tools still mobile-only on desktop (merge, split, pdf-to-image, …) |
| P2 | `pdf-to-word` browser path outputs RTF not DOCX |
| P2 | Legacy R2 account APIs coexist with Supabase auth |
| P3 | Report-issue dialog in ToolPage has no backend |
| P3 | Stripe vars still in `.env.example` (unused) |

---

## 9. Production checklist (copy-paste)

### Supabase
- [ ] Run `001_credit_ledger.sql`
- [ ] Run `002_payment_events.sql`
- [ ] Verify `profiles`, `processing_jobs`, `user_usage` exist
- [ ] Google OAuth provider enabled

### R2
- [ ] Bucket + CORS + API keys in Vercel env

### Railway
- [ ] Redis service linked
- [ ] Node AI worker: `npm run worker:ai`
- [ ] Python workers (7 pools) from `backend-service` repo

### Vercel
- [ ] All env from section 1
- [ ] `AUTH_ONLY_MODE=false` when ready for PayPal
- [ ] Deploy `vercel --prod`

### PayPal
- [ ] Sandbox test → live
- [ ] Webhook URL registered
- [ ] Plan IDs for monthly/yearly

### Smoke test
- [ ] Sign in with Google
- [ ] Compress PDF (cloud)
- [ ] Translate AI Plus (trial or credits)
- [ ] Buy credit pack (PayPal sandbox)
- [ ] Premium subscription webhook

---

## 10. File reference

| Doc | Purpose |
|-----|---------|
| `docs/FINAL_GO_LIVE.md` | Step-by-step deploy |
| `docs/PHASE_4_BILLING.md` | PayPal setup |
| `docs/RAILWAY_AI_WORKER.md` | AI worker |
| `supabase/migrations/001_*.sql`, `002_*.sql` | DB |

---

*End of 360° audit report.*

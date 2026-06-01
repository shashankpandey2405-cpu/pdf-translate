# Vercel + Supabase + Render (Worker) — Kya change karna hai

> Project mein PDF worker **Render** par chalta hai (`backend-service/`). Agar aap **Railway** use karte ho, same env vars Railway service par bhi set karein jo Render checklist mein hain.

---

## 1. Vercel (Next.js app) — **ZAROOR update**

Production → **Settings → Environment Variables**:

| Variable | Production value | Kyon |
|----------|------------------|------|
| `ENHANCED_DAILY_LIMIT` | **10** | Sign-in cloud jobs / din |
| `ENHANCED_MAX_FILE_MB` | **60** | Cloud file max |
| `ENHANCED_OCR_MAX_PAGES` | **20** | OCR pages / job |
| `ENHANCED_IP_DAILY_LIMIT` | **30** | Ek IP se cloud abuse cap |
| `ENHANCED_PRESIGN_HOURLY_LIMIT` | **8** | Presign bypass rokne ke liye |
| `ENHANCED_PRESIGN_DAILY_LIMIT` | **25** | Presign bypass rokne ke liye |
| `NEXT_PUBLIC_ENHANCED_ENABLED` | **true** | Cloud UI on |
| `ENHANCED_CALLBACK_URL` | `https://www.pdftrusted.com` | Worker callback (same origin) |
| `NEXT_PUBLIC_APP_URL` | `https://www.pdftrusted.com` | OAuth / links |

**KABHI mat lagana Production par:**

- `PDFTRUSTED_QA_MODE=true`
- `NEXT_PUBLIC_PDFTRUSTED_QA_MODE=true`
- `ENHANCED_UNLIMITED_USER_IDS` (sirf apna test UUID, production mein khali rakho)

Deploy ke baad: **Redeploy** karein taaki naye limits apply hon.

---

## 2. Supabase — **Auth + DB**

Dashboard changes (code deploy se alag):

1. **Authentication → URL Configuration**
   - Site URL: `https://www.pdftrusted.com`
   - Redirect URLs: `https://www.pdftrusted.com/**`, `http://localhost:3000/**`

2. **SQL / usage** — kuch change zaroori nahi jab tak `user_usage` table pehle se hai.

3. Vercel par ye keys **same project** se:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (sirf server, kabhi client mein nahi)

---

## 3. Render / Railway (OCR & cloud worker)

Har worker service (ocr, docx, compress, convert, office, security, excel) par:

| Variable | Value (Vercel ke saath match) |
|----------|--------|
| `RENDER_WORKER_SECRET` | Vercel jaisa same secret |
| `ENHANCED_CALLBACK_URL` | `https://www.pdftrusted.com` |
| `ENHANCED_MAX_FILE_MB` | **60** |
| `ENHANCED_OCR_MAX_PAGES` | **20** (sirf `WORKER_POOL=ocr`) |
| `ENHANCED_COMPRESS_MAX_PAGES` | **50** (compress pool) |
| `ENHANCED_DOCX_MAX_PAGES` / `ENHANCED_EXCEL_MAX_PAGES` | **50** |
| `ENHANCED_CONVERT_MAX_PAGES` | **50** (pdf-to-image / pptx) |
| `ENHANCED_SECURITY_MAX_PAGES` | **50** (protect / unlock / redact) |
| `ENHANCED_OFFICE_MAX_PAGES` | **50** (word / pptx → pdf) |
| `UPSTASH_REDIS_REST_URL` | Same Redis as Vercel |
| `UPSTASH_REDIS_REST_TOKEN` | Same token |
| `S3_*` | Same R2 bucket as Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as Vercel |
| `WORKER_POOL` | `ocr` / `docx` / `compress` / `convert` / `office` / `security` / `excel` |

Railway par bhi **bilkul wahi values** — bas service alag hai, logic same. Agar worker par `ENHANCED_MAX_FILE_MB=50` ya `ENHANCED_OCR_MAX_PAGES=5` reh gaya to Vercel 60MB/20 pages allow karega lekin worker job **fail** karega (`file_too_large` / `too_many_pages`).

---

## 4. Cloudflare R2

- CORS: `https://www.pdftrusted.com` + staging origin allow PUT/GET
- Bucket same jo `S3_BUCKET` mein hai

---

## 5. Bot block (naya code)

- **Middleware**: scraper / script User-Agent → `/api/*` block (health/session allow)
- **Redis burst**: presign, jobs, local-rate par IP hourly cap
- **Presign limit**: user ID par hourly/daily presign cap (quota bypass nahi)

Agar Redis (Upstash) Production par **nahi** hai → rate limits kamzor ho jayenge; **Upstash zaroor connect karein**.

---

## 6. Limit bypass kaise nahi hoga

| Attack | Defense |
|--------|---------|
| Browser console se fake “unlimited” | Cloud jobs **server** `reserveEnhancedJobSlot` — client sirf UI |
| QA mode production par | `isServerQaBypassActive()` hamesha false on Vercel prod |
| Bahut saare presign URLs | `assertPresignRateLimit` + job par slot reserve |
| Bot API spam | `botGuard` + `runApiGuard` |
| Bina login cloud | `requireApiUser()` on presign/jobs |
| Galat user ka R2 key | Key must start with `enhanced/input/{userId}/` |

---

## 7. Quick verify after deploy

```bash
npm run build
npm run qa:assert-prod
```

Browser: signed-in user → Usage badge **10** jobs/day dikhna chahiye.  
OCR upload >20 pages → server **413**.  
File >60MB cloud → **413**.

---

---

## 8. AI tools (Summarize + Translate AI Plus) — **OpenRouter on Vercel**

| Variable | Production |
|----------|------------|
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `OPENROUTER_MODEL_TRANSLATE` | `google/gemini-2.0-flash-001` (cheap default) |
| `OPENROUTER_MODEL_SUMMARIZE` | same as translate |
| `OPENROUTER_FALLBACK_MODELS` | `openai/gpt-4o-mini,deepseek/deepseek-chat` |
| `AI_PLUS_MAX_FILE_MB` | **5** |
| `AI_PLUS_MAX_PAGES` | **2** |
| `AI_LIFETIME_TRIAL_LIMIT` | **1** |
| `CRON_SECRET` | Cron auth (`/api/internal/ai-process` backup drain) |

**Railway:** koi naya `ai` worker deploy **zaroori nahi** (unless you add Python AI later). Existing 7 pools bas **limits sync** karo (section 3).

**AI cron:** not scheduled on Vercel — jobs start on upload (`triggerAiQueueProcessing`). Stuck queue: call `/api/internal/ai-process` manually (see below). Daily `r2-staging-purge` cron remains for cleanup only.

**Supabase:** koi naya table nahi — `processing_jobs` + `user_usage` pehle se kaafi. AI trial Redis key: `ai:trial:used:{userId}`.

---

**Last updated:** limits batch + AI Plus on Vercel + backend-service@536fe81 pushed.

# PDFTrusted external repositories

Production is split across **three GitHub repos** + **Vercel CLI** (no Git auto-deploy on Vercel). Keep env vars aligned (same `REDIS_URL`, `RENDER_WORKER_SECRET`, R2 keys).

| Repo | Clone URL | Deploy target | Tools / role |
|------|-----------|---------------|--------------|
| **pdf** (this app) | https://github.com/shashankpandey2405-cpu/pdf.git | **Vercel CLI** (`npm run deploy:vercel:prod`) — GitHub push does **not** auto-deploy | Next.js UI + `/api/enhanced/*` enqueue + poll |
| **backend-service** | https://github.com/shashankpandey2405-cpu/backend-service.git | Railway (7 pools) | OCR, PDF→Word, compress, excel, office, security, convert |
| **ai** | https://github.com/shashankpandey2405-cpu/ai.git | Railway (`npm run worker:ai`) | Translate, summarize, chat PDF, question gen (OpenRouter) |

## Deploy commands (canonical)

```bash
# Main app → Vercel (direct; project is not wired to GitHub auto-deploy)
npm run deploy:vercel:prod

# Python workers (from backend-service/ clone)
git push origin master   # then redeploy Railway services per WORKER_POOL

# AI worker (from ai/ clone; sync server/ai/* from pdf first — see below)
git push origin main     # then redeploy Railway AI service
```

Local clone of workers (sibling folders):

```bash
git clone https://github.com/shashankpandey2405-cpu/backend-service.git
git clone https://github.com/shashankpandey2405-cpu/ai.git
```

## When to update which repo

| Change | Repo |
|--------|------|
| UI, routing, browser tools, Vercel API routes | **pdf** (here) |
| Ghostscript compress, ocrmypdf, docx pipeline, qpdf | **backend-service** |
| OpenRouter models, AI processor, credit settle on worker | **ai** |
| PDF→Word size/blank-page fixes | **backend-service** `docx.v4` — see `docs/PDF_TO_WORD_QUALITY.md` |
| Redis queue key format / priority lists | **pdf** + **backend-service** (+ **ai** if `server/enhanced/redis.ts` changes) |

## Sync checklist (AI)

After editing `server/ai/*` in **pdf**:

1. Copy `server/ai/*` → [ai repo](https://github.com/shashankpandey2405-cpu/ai) `server/ai/`
2. Do **not** replace `ai/server/workers/runAiWorker.ts` (Railway health server lives there)
3. Push **ai** → redeploy Railway AI service

## Sync checklist (Python workers)

After editing worker consumer / pipelines locally:

1. Push **backend-service** → redeploy affected Railway services (`WORKER_POOL=compress`, etc.)

## May 2026: Premium queue fix

- **Problem:** Premium jobs on `enhanced:queue:{pool}:premium`; old workers only read base key.
- **Fix:** `backend-service` `priority_queue_keys` + Vercel `WORKERS_PRIORITY_QUEUES` (see `docs/CLOUD_QUEUE_FIX.md`).

## Local clone paths (optional)

```text
../repos/backend-service   # git clone backend-service
../repos/ai                # git clone ai
```

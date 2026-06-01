# Cloud queue fix (Premium jobs stuck at ~30%)

## Worker requeue crash (May 2026)

- **Problem:** `consumer.py` called `queue_key(pool)` in `requeue_job` without importing it → `NameError` on transient failures; jobs stuck in `:processing`.
- **Fix:** Import `queue_key` from `app.redis_client`. Redeploy **all** Railway worker pools (ocr, docx, office, excel, compress, …).

## Root cause (premium queue)

Premium users enqueue to `enhanced:queue:{pool}:premium`. Railway Python workers only consumed `enhanced:queue:{pool}` until May 2026.

Symptoms: progress reaches ~30% (upload + enqueue done), then stays **queued** forever; Railway worker logs show no `[compress-worker] consume` lines.

## Fixes applied

1. **backend-service** (`app/redis_client.py`, `app/queue/consumer.py`): `claim_job` pops `:premium`, base, then `:free` (matches `server/enhanced/queueContract.ts`).
2. **Vercel** (`WORKERS_PRIORITY_QUEUES=false` by default): new jobs enqueue on the **default** list so workers pick them up immediately without redeploy.
3. After redeploying all worker services with the Python fix, set on Vercel: `WORKERS_PRIORITY_QUEUES=true`.

**Repos:** Python fix → https://github.com/shashankpandey2405-cpu/backend-service · AI worker → https://github.com/shashankpandey2405-cpu/ai · See `docs/EXTERNAL_REPOS.md`.

## AI queue (chat-pdf, summarize, translate)

Symptoms: upload reaches ~30%, then **“Cloud workers did not start your job”** within ~90s.

**Vercel (pdftrusted repo, May 2026+):**

- `kickAiQueueAfterEnqueue` now **awaits** Railway ping + `/api/internal/ai-process` (with `CRON_SECRET` / `RENDER_WORKER_SECRET` auth).
- Daily cron also wakes AI when `enhanced:queue:ai` has depth.
- Set `RAILWAY_AI_WORKER_PING_URL=https://<railway-ai-service>` and matching `RAILWAY_AI_WORKER_SECRET` (or reuse `RENDER_WORKER_SECRET`).
- Emergency: `AI_QUEUE_DRAIN_ON_VERCEL=true` so Vercel drains the AI queue directly.

**Railway AI service:** `npm run worker:ai` (`railway.ai.toml`), same `REDIS_URL` + `OPENROUTER_API_KEY` as Vercel.

## Deploy checklist

### Vercel (now)

- Deploy latest Next.js
- Keep `WORKERS_PRIORITY_QUEUES` unset or `false`
- Verify: `REDIS_URL` (public TCP), `RENDER_WORKER_SECRET`, `ENHANCED_CALLBACK_URL=https://www.pdftrusted.com`, S3/R2 keys

### Railway workers (backend-service repo)

Redeploy **ocr**, **docx**, **compress** (and other pools you use) from `backend-service/` with updated consumer.

Required env per service:

- `WORKER_POOL=compress` (or ocr/docx/…)
- `REDIS_URL` (same as Vercel)
- `RENDER_WORKER_SECRET` (same as Vercel)
- `ENHANCED_CALLBACK_URL=https://www.pdftrusted.com`
- S3/R2 credentials

Then set `WORKERS_PRIORITY_QUEUES=true` on Vercel.

### Stuck jobs in `:premium` queues

After worker redeploy, workers drain old premium-list jobs automatically. Or inspect with authorized `GET /api/enhanced/health` (`queueByPriority`).

## Browser compress (scans)

Browser mode only strips metadata via pdf-lib — **scanned PDFs will not shrink**. Use **Trusted Cloud** (Ghostscript on compress worker) for real reduction.

## Billing

Railway usage ~$3–14 estimated is normal; workers idle does not mean account is out of funds.

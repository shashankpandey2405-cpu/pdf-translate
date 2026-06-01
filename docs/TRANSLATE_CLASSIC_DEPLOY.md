# Classic Translate PDF (open-source MT)

Self-hosted layout-preserving translation without OpenRouter. Digital PDFs use **Classic**; scanned PDFs auto-route to **AI**.

## Services

| Service | Command / image | Env |
|---------|-----------------|-----|
| **translate-mt** | `docker/translate-mt` (Argos/OPUS via FastAPI) | Port 5000 |
| **translate worker** | `npm run worker:translate` | `TRANSLATE_MT_URL`, `REDIS_URL` |
| **Vercel** | Next.js app | `TRANSLATE_MT_URL=https://…` |

## Railway

1. Deploy **translate-mt** using `railway.translate.toml` (Dockerfile `docker/translate-mt/Dockerfile`).
2. Deploy **translate worker** using `railway.translate-worker.toml` (`npm run worker:translate`).
3. Set on worker + Vercel:
   - `TRANSLATE_MT_URL` = public URL of translate-mt (no trailing slash)
   - `REDIS_URL` = same Redis as enhanced queues
   - `TRANSLATE_MT_TIMEOUT_MS=120000` (optional)

## VPS sizing

| Tier | RAM | Notes |
|------|-----|-------|
| Small | 4 GB | 2–4 language pairs |
| Medium | 8 GB | Recommended production |
| Large | 16 GB+ | Many pairs + batch load |

## API

- `POST /api/translate/analyze` — `{ inputR2Key }` → digital/scanned + `recommendedEngine`
- `POST /api/enhanced/jobs` with `options.processingMode: "classic_mt"` for translate-pdf

## Health

- MT service: `GET {TRANSLATE_MT_URL}/health`
- Classic jobs require `classicMtAvailable` and selectable text in PDF

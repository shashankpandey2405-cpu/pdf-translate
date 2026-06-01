# PDFTrusted QA Report

Generated: 2026-05-17T23:12:14.080Z

## Executive summary

- QA bypass mode: **inactive**
- Tool routes: 38/38 passed
- Cloud health: configured
- Queue audit: OK

## 1. Critical findings

| Area | Status |
|------|--------|
| Worker callback auth | OK (403 without secret) |
| API health | OK |
| Production QA guard | See qa-assert-no-prod-qa |

## 2. Cloud pipeline

- redis: yes
- s3: yes
- supabaseServiceRole: yes
- workerSecret: yes
- callbackUrl: yes

### Queue depths

- ocr: 0
- docx: 0
- compress: 0



## 3. Premium / usage API

- enhancedRemaining: n/a
- dailyLimit: n/a

## 4. Local rate limit

- allowed: true
- QA mode: false

## 5. Tool-by-tool routes

- [x] compress-pdf (200)
- [x] pdf-editor (200)
- [x] translate-pdf (200)
- [x] ocr-pdf (200)
- [x] redact-pdf (200)
- [x] repair-pdf (200)
- [x] ai-scanner (200)
- [x] merge-pdf (200)
- [x] split-pdf (200)
- [x] rotate-pdf (200)
- [x] universal-converter (200)
- [x] pdf-to-word (200)
- [x] pdf-to-image (200)
- [x] pdf-to-png (200)
- [x] pdf-to-epub (200)
- [x] pdf-to-jpg (200)
- [x] pdf-to-pptx (200)
- [x] pdf-to-excel (200)
- [x] pdf-to-html (200)
- [x] chat-pdf (200)
- [x] pdf-maker (200)
- [x] word-to-pdf (200)
- [x] png-to-pdf (200)
- [x] epub-to-pdf (200)
- [x] jpg-to-pdf (200)
- [x] pptx-to-pdf (200)
- [x] excel-to-pdf (200)
- [x] document-scanner (200)
- [x] photo-resizer (200)
- [x] resume-builder (200)
- [x] unlock-pdf (200)
- [x] protect-pdf (200)
- [x] hard-lock-pdf (200)
- [x] watermark-pdf (200)
- [x] page-numbers (200)
- [x] sign-pdf (200)
- [x] remove-watermark (200)
- [x] generate-qr-code (200)

## 6. E2E (Playwright)

_Run: npm run qa:e2e (requires dev server)_

## 7. Security & QA guards

- QA bypass gated by `PDFTRUSTED_QA_MODE` + non-production env only
- `next.config.mjs` throws if QA mode set on Vercel production
- Worker callback requires `x-worker-secret` matching `RENDER_WORKER_SECRET`
- Presign/jobs require Supabase session (no production auth bypass)
- `ENHANCED_CALLBACK_URL` must match deployed Next origin

## 8. Manual checks still required

- Physical iOS/Android device upload
- Render worker OOM under large PDFs
- OCR multilingual accuracy
- R2 CORS from localhost
- Full Premium job: upload → worker → download

## 9. Infrastructure audit (Phase 1)

- Critical keys missing: **0** (see reports/infra-audit.json)

## 10. Presign API

- Unauthenticated behavior: OK (401/503)

## 11. Jobs lifecycle (Phase 2 cloud)

_Skipped — set QA_SESSION_COOKIE for full presign → R2 → job → poll test_

## 12. SEO scan

_Run npm run qa (includes qa-seo-scan) or no hits_

## 13. Deployment readiness

| Gate | Status |
|------|--------|
| Enhanced infra | pass |
| Worker reachable | manual: WORKER_HEALTH_URL + backend-service/scripts/worker-healthcheck.mjs |
| R2 CORS | manual: allow PUT from app origin |
| Auth OAuth redirects | manual: Supabase URL config |

## 14. Recommended milestones

1. Run `npm run qa:infra` and fix MISSING critical keys
2. Run authenticated `jobs-lifecycle` with worker + callback URL
3. Playwright mobile projects (`npm run qa:e2e`)
4. Lighthouse on `/en` and `/en/compress-pdf` before launch
5. Stress: `node scripts/qa-stress-health.mjs` with production-like load

# System architecture summary

Generated: 2026-05-18

## Stack
- **Vercel:** Next.js 15 SPA + `app/api` gateway
- **Supabase:** Auth, `processing_jobs`, `user_usage*`, `login_events`, `job_trace_events`
- **Upstash Redis:** Job queues, rate limits, usage idempotency
- **Cloudflare R2:** Input/output objects (S3 API)
- **Render:** Python workers (ocr, docx, compress pools)

## Live Premium cloud tools
compress-pdf, pdf-to-word, ocr-pdf

## Hybrid flow
Upload → ProcessingModeModal (Normal vs Premium) → browser pipeline OR presign → R2 → Redis → worker → callback → poll

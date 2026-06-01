# Deployment checklist

Generated: 2026-05-18

## Vercel

- [ ] `NEXT_PUBLIC_ENHANCED_ENABLED=true`
- [ ] `NEXT_PUBLIC_APP_URL=https://www.pdftrusted.com`
- [ ] `ENHANCED_CALLBACK_URL` matches app URL
- [ ] `ENHANCED_MAX_FILE_MB=50`
- [ ] `ENHANCED_DAILY_LIMIT=2`
- [ ] Supabase + Redis + R2 + `RENDER_WORKER_SECRET`

## Render

- [ ] Four services: health + ocr + docx + compress workers
- [ ] Each worker `WORKER_POOL` set correctly
- [ ] `npm run worker:health` returns 200

## Verify

- [ ] `curl https://www.pdftrusted.com/api/enhanced/health`
- [ ] `npm run qa:cloud-e2e` (with session cookie)
- [ ] OCR / Compress / PDF-to-Word Premium download opens valid file

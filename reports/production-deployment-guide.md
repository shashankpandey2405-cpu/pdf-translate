# Production deployment guide

Generated: 2026-05-18

Extends `docs/DEPLOY-ENV.md` and launch checklist.

## Vercel
1. Set all section-1 vars from `.env.example`
2. `NEXT_PUBLIC_ENHANCED_ENABLED=true` when Render workers are live
3. `ENHANCED_CALLBACK_URL` must match deployed origin
4. Do **not** set payment or AI API keys (removed)

## Render
Deploy `backend-service/render.yaml` pools: ocr, docx, compress. Same `RENDER_WORKER_SECRET` as Vercel.

## Verify
```bash
npm run typecheck
npm run qa:unit
npm run build
npm run bundle:report
npm run qa:assert-prod
node scripts/diagnostics-enhanced.mjs
```

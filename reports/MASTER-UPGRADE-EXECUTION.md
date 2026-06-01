# PDFTrusted Master Upgrade — Execution Report

Generated: 2026-05-29  
Checkpoint: upgrade-cp1 through cp7 (single implementation pass)

## Phase 1 — Performance + Bundle

**Implemented**
- Webpack `splitChunks.cacheGroups` for pdfjs, pdf-lib, fabric, mupdf, opencv, tesseract, xlsx ([next.config.mjs](../next.config.mjs))
- Lazy wrappers: [src/lib/lazy/](../src/lib/lazy/)
- `@next/bundle-analyzer` + `npm run analyze`
- Bundle baseline/delta scripts: [scripts/bundle-baseline.mjs](../scripts/bundle-baseline.mjs)
- pdf.js worker version check: [scripts/verify-pdfjs-worker-version.mjs](../scripts/verify-pdfjs-worker-version.mjs)
- CI budgets tightened: 16 MB total / 6 MB largest chunk ([scripts/bundle-size-report.mjs](../scripts/bundle-size-report.mjs))
- DropZone prefetches pdf stack on pointer enter

**Remaining toward 4 MB target**
- Per-tool dynamic imports for all 42 eager tool routes
- Run `npm run analyze` and split shared vendor further

## Phase 2 — Safari + Mobile Stability

**Implemented**
- Safari-aware DPR caps: [canvasBudget.ts](../src/lib/render/canvasBudget.ts), [hiDpiCanvas.ts](../src/lib/hiDpiCanvas.ts)
- Worker cleanup on SplitPDF, ToolPage (plus existing Merge/Compress)
- pdfJobQueue pauses when tab hidden
- PWA SW cache v13

**Remaining**
- PDF editor visible-page-only rendering (virtualization)
- Unified pdf.js doc cache (pdfjsClient vs pdfjsEngine)

## Phase 3 — Smart Hybrid Routing

**Implemented**
- Unified scorer: [routingScore.ts](../src/lib/processing/routingScore.ts)
- `useSmartDocumentRoute` uses routing v2 (`NEXT_PUBLIC_ROUTING_V2`, default on)
- Tool rules: compress image-heavy, redact/protect cloud bias, merge large page count

## Phase 4 — Large File + Upload

**Implemented**
- Poll transient retry (3x) in [enhancedJobClient.ts](../src/lib/enhanced/enhancedJobClient.ts)
- Direct presigned download default (`NEXT_PUBLIC_DIRECT_DOWNLOAD`, default on) in [useEnhancedJob.ts](../src/hooks/useEnhancedJob.ts)
- Multipart foundation: [multipartUpload.ts](../src/lib/enhanced/multipartUpload.ts) (enable via `NEXT_PUBLIC_ENHANCED_MULTIPART`)

**Remaining**
- Wire enhanced multipart to `/api/multipart/*` with `enhanced/input/` prefix

## Phase 5 — Browser Engine

**Implemented**
- Split separate-files path uses worker ([split-pdf/logic.ts](../src/tools/split-pdf/logic.ts), worker API extended)

## Phase 6 — Compression + Quality

**Implemented**
- Browser compress prediction: [compressPrediction.ts](../src/lib/processing/compressPrediction.ts)

**Backend-service (coordinate deploy)**
- PaddleOCR path for ar/hi/zh
- Ghostscript preset tuning

## Phase 7 — AI Pipeline

**Implemented**
- Redis text extraction cache: [textCache.ts](../server/ai/textCache.ts) wired in [processor.ts](../server/ai/processor.ts)

**Remaining**
- SSE streaming for chat
- Consolidate question-gen into documentAi

## Phase 8 — Cloud Scaling + Queue

**Implemented**
- Atomic `claimQueueItem` via `rpoplpush` ([redis.ts](../server/enhanced/redis.ts), [client.ts](../server/redis/client.ts))
- AI queue worker uses claim semantics ([queueWorker.ts](../server/ai/queueWorker.ts))
- Health API: `processingQueueDepth` per pool

**Ops**
- Enable `WORKERS_PRIORITY_QUEUES=true` on Vercel + Render workers together
- Document: [docs/QUEUE_OPS.md](../docs/QUEUE_OPS.md)

## Phase 9 — UX, Trust, SEO

**Implemented**
- Cookie consent uses overlay priority slot
- SW v13 aligned with deploy cycle

**Remaining**
- Wire exit intent, returning guest, guest idle to overlay slots
- Locale alias URLs in sitemap
- OG 1200×630 assets
- Lighthouse CI

## Validation

```bash
npm run typecheck
npm run build
npm run build:gate   # after bundle meets budget
node scripts/verify-pdfjs-worker-version.mjs --strict
node scripts/verify-security-phase.mjs
```

## Rollback

Feature flags (set `false` to revert):
- `NEXT_PUBLIC_ROUTING_V2`
- `NEXT_PUBLIC_DIRECT_DOWNLOAD`
- `NEXT_PUBLIC_ENHANCED_MULTIPART`

Revert webpack splitChunks block in next.config.mjs if chunk waterfall causes regressions.

## Competitor positioning

| Area | Status after upgrade |
|------|---------------------|
| Privacy / hybrid | Strong |
| Browser merge/split | Strong |
| Cloud compress/OCR | Competitive (workers) |
| Mobile Safari stability | Improved (DPR + queue pause) |
| TTI / bundle | Improved (split); target 4 MB ongoing |
| AI cost efficiency | Improved (text cache) |

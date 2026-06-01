# PDFTrusted Ultimate Architecture Cleanup & Pipeline Audit

**Date:** 2026-05-28  
**Scope:** Full 360° audit — Phases 1–8  
**Method:** Static code analysis, route audit, subagent mapping, existing reports cross-check, `audit:predeploy` partial run  
**Constraint:** No new features. No blind refactors. Pipelines reported **working** at audit start — changes are recommendations only unless explicitly approved.

---

## Executive summary

PDFTrusted is a **hybrid PDF platform**: browser processing (pdf-lib, pdf.js, Comlink workers) for privacy-first tools + **Vercel API** + **Redis queues** + **Railway Python workers** (`backend-service`) + **Railway/Vercel AI worker** (`ai` repo) for cloud/OCR/office/AI.

**Architecture health:** Production-viable. Trust controls (HMAC worker callbacks, R2 key scoping, same-origin upload/download proxies) are solid. Recent fixes (R2 CSP proxy, Word→PDF blank pages, PDF→Word editable output, Smart Scan UI) are wired correctly.

**Cleanup debt:** ~32 dead legacy Vite pages, duplicate unwired layout shells, orphan npm deps, legacy `worker/` Hono tree, broken npm scripts, zero unit tests blocking `audit:predeploy`, and one config gap (`pdf-to-pdfa` queued but not implemented in Python worker).

**Recommended next action:** Safe dead-code deletion (Phase 4 list) in a single PR — no pipeline logic changes.

| Dimension | Score | Notes |
|-----------|-------|-------|
| Pipeline wiring | **88/100** | Direct paths exist; intentional proxy layers for CSP |
| Code cleanliness | **62/100** | Legacy trees + unwired abstractions |
| Performance | **70/100** | Download proxy streams through Vercel; homepage JS heavy |
| UI consistency | **78/100** | Desktop master shell good; mobile mixed |
| Production readiness | **82/100** | Typecheck ✅, routes ✅, vitest ❌ (no tests) |
| Maintainability | **74/100** | 3 repos; external `backend-service` drift risk |

---

## Phase 1 — Full dependency & pipeline mapping

### 1.1 System topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BROWSER (React 19 + Wouter in Next shell)                                   │
│  • pdf-lib / pdf.js / Comlink worker / OpenCV (scanner)                     │
│  • Supabase Auth (OAuth, email) → GET /api/session for isPremium            │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Next API      │     │ Supabase        │     │ Cloudflare R2   │
│ src/app/api/* │     │ auth + jobs +   │     │ staging/        │
│ server/*      │     │ credits + trace │     │ enhanced/input  │
└───────┬───────┘     └─────────────────┘     │ enhanced/output │
        │                                       └────────▲────────┘
        │ Redis LPUSH                                      │ GET/PUT
        ▼                                                  │
┌───────────────┐     callback POST              ┌─────────┴─────────┐
│ Upstash Redis │ ◄────────────────────────────│ Railway workers   │
│ enhanced:     │                              │ backend-service   │
│ queue:{pool}  │                              │ (7 Python pools)  │
└───────────────┘                              └─────────┬─────────┘
        │                                                  │
        │ enhanced:queue:ai                                │ Gotenberg
        ▼                                                  │ (office pool)
┌───────────────┐                              ┌───────────▼─────────┐
│ AI worker     │ ─── OpenRouter ───────────►│ External AI APIs    │
│ ai repo /     │                              └───────────────────┘
│ Vercel drain  │
└───────────────┘
```

### 1.2 Frontend → API connections (47 routes)

| Category | Routes | Primary callers |
|----------|--------|-----------------|
| **Session / auth** | `/api/session`, `/auth/callback`, `/api/auth/*` (410) | `PremiumContext`, `authSession.ts`, Supabase client |
| **Browser staging** | `/api/r2/presign-put`, `/api/r2/upload`, `/api/r2/delete-staged`, `/api/multipart/*` | `chunkedUpload.ts`, `stagedFileRegistry.ts` |
| **Enhanced cloud** | `/api/enhanced/presign`, `/api/enhanced/upload`, `/api/enhanced/jobs`, poll, download, purge | `useEnhancedJob`, `enhancedJobClient.ts`, `fetchResultBlob.ts` |
| **Credits / billing** | `/api/credits/*`, `/api/checkout/*`, `/api/webhooks/paypal` | Account, checkout, PayPal fulfillment |
| **AI interactive** | `/api/ai/chat`, `/api/ai/session/[jobId]`, image-session, translate-snippet, smart-scan/revise | Chat/summarize/smart-scan panels |
| **Internal / cron** | `/api/internal/ai-process`, ai-worker-ping, job-trace; `/api/cron/r2-staging-purge` | Server-side queue drain, Vercel cron |
| **Debug (gated)** | `/api/debug/agent-log`, `/api/debug/ai-test` | 403/404 in prod unless QA secret |

**Central orchestration:** `useEnhancedJob` → presign → upload (proxy) → create job → poll → same-origin download.

### 1.3 Frontend → external services

| Service | Connection | Purpose |
|---------|------------|---------|
| **Supabase** | `@supabase/supabase-js` direct + SSR cookies | Auth, optional realtime |
| **R2** | Indirect via API proxies (CSP); presigned PUT fallback | File storage |
| **Sentry** | `/api/sentry-tunnel` | Error reporting |
| **Vercel Analytics** | `@vercel/analytics` | Page views |
| **PayPal** | Checkout redirect + webhook | Credits/subscription |
| **OpenRouter** | Server-only (`server/ai/openrouter.ts`) | AI models |

### 1.4 Worker pool → tool mapping

| Pool | Tools | Engine | Output |
|------|-------|--------|--------|
| `docx` | pdf-to-word | pdf2docx + OCR preflight + LO fallback | .docx |
| `excel` | pdf-to-excel | pdfplumber + Camelot | .xlsx |
| `office` | word-to-pdf, pptx-to-pdf | Gotenberg / LibreOffice + blank-page fix | .pdf |
| `compress` | compress-pdf | pdfcpu / Ghostscript | .pdf |
| `ocr` | ocr-pdf | OCRmyPDF + Tesseract + Paddle | .pdf |
| `convert` | pdf-to-image/png/jpg, pdf-to-pptx | PyMuPDF | .zip / .pptx |
| `security` | protect/unlock/redact-pdf | qpdf / PyMuPDF | .pdf |
| `ai` | summarize, translate, chat, smart-scan, question-gen | Node + OpenRouter + vision | varies |

**Gap:** `pdf-to-pdfa` maps to `convert` in Vercel config but **not implemented** in `backend-service/app/job_runner.py`.

### 1.5 Redis queue contract

```
Key: enhanced:queue:{pool}[:premium|:free]
Processing: enhanced:queue:{pool}:processing
Dead letter: enhanced:dead:{pool}
Payload: {jobId}|{inputR2Key}|{urlencoded JSON options}?|{traceId}?

Enqueue: Vercel LPUSH (priority suffix)
Claim: Worker RPOPLPUSH premium → default → free → processing
Complete: POST /api/enhanced/worker/callback (HMAC signed)
```

### 1.6 Duplicate / legacy paths identified

| Item | Severity | Detail |
|------|----------|--------|
| `worker/` Hono app | Medium | 20 files mirroring old Cloudflare routes; **not used** by `npm run dev` |
| `src/legacy-vite-pages/` | High | 32 files, **zero imports** |
| `AppRoutes.tsx` + `LocaleDocumentFrame.tsx` | Medium | Duplicate of `App.tsx`, **unwired** |
| `/api/r2/upload` vs `/api/enhanced/upload` | Low | Intentional split (staging vs cloud policy) |
| `/api/auth/*` vs Supabase | Low | Auth.js removed; route returns 410 |
| `/api/account-*` vs Supabase | Low | Legacy credential auth; reset-password still used for `?token=` |
| `docx_premium.py`, `docling_optional.py` | Low | Unused in backend-service |
| Dual callback impl | Low | Python `callback.py` + TS `workerCallback.ts` (different runtimes) |

### 1.7 Circular dependencies

**None critical found.** Provider tree in `App.tsx` is deep but acyclic. `server/` modules import from `@/server/*` cleanly.

---

## Phase 2 — Pipeline wiring audit

### 2.1 Optimal paths (verified working)

**Browser tool (e.g. Merge PDF):**
```
Upload → local File → pdfProcessing.worker → download blob
Optional: presign staging → process → delete-staged
```
✅ Shortest path. No unnecessary hops.

**Cloud tool (e.g. PDF→Word):**
```
File → presign → /api/enhanced/upload (proxy) → POST jobs → Redis → Railway docx pool
→ R2 output → callback → poll → GET /api/enhanced/jobs/:id/download
```
✅ Direct. Same-origin download avoids CSP issues (intentional, not redundant).

**AI tool (e.g. Smart Scan):**
```
File → enhanced job (pool=ai) → Railway AI worker OR Vercel drain
→ callback → download PDF → /api/ai/session + /api/ai/chat
```
✅ Post-job chat is separate by design (session stored server-side).

### 2.2 Intentional middle layers (keep)

| Layer | Why it exists |
|-------|---------------|
| `/api/enhanced/upload` proxy | Browser CSP blocks direct R2 PUT |
| `/api/enhanced/jobs/:id/download` | Same-origin download; no exposed presigned URLs |
| `fetchResultBlob.ts` URL rewrite | Normalizes any R2 URL in poll response to same-origin |
| `kickAiQueueAfterEnqueue` | Railway ping + Vercel `/api/internal/ai-process` safety net |
| `PremiumContext` + `/api/session` | Server-side premium flag; can't trust client JWT alone |

### 2.3 Simplification candidates (safe)

| Current | Proposed | Risk |
|---------|----------|------|
| `A → presign → proxy upload → jobs` with PUT fallback | Proxy-only when `key` provided (already default for enhanced) | Low — done |
| `App.tsx` + `AppRoutes.tsx` + `LocaleDocumentFrame.tsx` | Delete unwired duplicates | None if deleted |
| `CompressDesktopExperience.tsx` | Inline into `CompressDesktopAdapter` | None |
| `useCloudToolProcessing.ts` | Delete (unused) | None |
| `worker/` directory | Delete or archive | Verify no CF deploy still references |
| `@tanstack/react-query` provider | Remove if no `useQuery` usage | Low — verify first |
| Direct R2 PUT retry in `chunkedUpload` | Keep as fallback until CSP proven stable everywhere | Medium |

### 2.4 Redundant validations

| Location | Issue |
|----------|-------|
| Client `pageCount` at enqueue | Trusted from browser; server should verify from R2 PDF (known gap C3) |
| MIME at presign vs enqueue | Magic bytes only at enqueue (partially tightened) |
| Credit estimate + job create | Two round-trips for AI+ mode — necessary for UX gate |

---

## Phase 3 — Performance bottleneck detection

### 3.1 Network / API

| Bottleneck | Impact | Recommendation |
|------------|--------|----------------|
| Download streams full file through Vercel | High for 500MB premium files | Future: signed same-origin redirect or range proxy with size cap |
| Sequential presign → upload → create job | Expected; can't parallelize | OK |
| `refreshUsage()` after every cloud job | Extra GET `/api/enhanced/usage` | Debounce or invalidate on modal open only |
| Session fetch on chunked upload | `chunkedUpload` calls `/api/session` | Cache in `PremiumContext` (likely already warm) |
| AI queue dual kick (Railway + Vercel) | 2 internal requests per enqueue | Intentional reliability tradeoff |

### 3.2 Frontend rendering

| Bottleneck | Impact | Recommendation |
|------------|--------|----------------|
| Homepage + tool routes bundle size | Mobile LCP ~8.9s (prior Lighthouse) | Lazy-load OpenCV, fabric, mammoth per tool |
| `App.tsx` monolith (~500 lines, 70+ routes) | Maintenance, not runtime | Split routes file when deleting duplicates |
| Duplicate `ToolSEO` + JSON-LD per page | Minimal runtime cost | OK for SEO |
| pdf.js worker 1.2MB | Required | Already code-split |

### 3.3 Backend / workers

| Bottleneck | Impact | Recommendation |
|------------|--------|----------------|
| Single-thread executor per worker pod | By design (memory safety) | Scale horizontally via Railway replicas |
| docx pool OCR preflight on digital PDFs | Slow path for scans only | `docxFastPath` already exists |
| Gotenberg ↔ LibreOffice double fallback | Adds latency on failure | OK for reliability |
| Orphan requeue ignores priority suffix | Jobs may land in wrong queue | Fix in consumer (known) |

### 3.4 Memory / leaks

| Area | Status |
|------|--------|
| `useEnhancedJob` abortRef | ✅ Cleanup on unmount |
| Event listeners in PDF editor (fabric) | ⚠️ Audit on navigation away |
| `useScrollDebug` / `useScrollRecovery` | Never mounted — N/A |
| SW cache (`public/sw.js`) | Version-bumped on deploy |

---

## Phase 4 — Dead code elimination

### 4.1 Safe to delete (high confidence, not actively imported)

| Path | Files | Evidence |
|------|-------|----------|
| `src/legacy-vite-pages/**` | 32 | Zero imports in repo |
| `src/hooks/useCloudToolProcessing.ts` | 1 | No consumers |
| `src/hooks/useScrollDebug.ts` | 1 | No consumers |
| `src/hooks/useScrollRecovery.ts` | 1 | No consumers |
| `src/components/layout/AppRoutes.tsx` | 1 | Never imported |
| `src/components/layout/LocaleDocumentFrame.tsx` | 1 | Never imported |
| `src/components/FooterToolSitemap.tsx` | 1 | No importers |
| `src/components/PricingCtaButton.tsx` | 1 | Only legacy-vite-pages |
| `src/main.tsx` | 1 | Deprecated Vite bootstrap |
| Orphan shadcn UI | 7 | chart, calendar, carousel, drawer, input-otp, resizable, sidebar |
| `backend-service/app/pipelines/docx_premium.py` | 1 | Deprecated shim |
| `backend-service/app/pipelines/docling_optional.py` | 1 | Never imported |

### 4.2 Unused npm dependencies (high confidence)

| Package | Action |
|---------|--------|
| `react-rnd`, `@types/react-rnd` | Remove |
| `recharts` | Remove (only orphan `chart.tsx`) |
| `marked` (devDep) | Remove |
| `date-fns` (devDep) | Remove + stale `optimizePackageImports` entry |

### 4.3 Borderline (verify before delete)

| Item | Notes |
|------|-------|
| `worker/` directory | Legacy Cloudflare; confirm no active CF Worker deploy |
| `@tanstack/react-query` | Provider only, no hooks |
| `vite`, `vite-plugin-pwa`, `@vitejs/plugin-react` | Only `dev:vite` script |
| `/api/multipart/abort` | No frontend caller — keep for API completeness |
| `/api/account-register`, forgot-password | No UI; keep for legacy token flows |

### 4.4 Broken npm scripts

These reference **missing files**:
- `cleanup:inventory` → `scripts/cleanup-inventory.mjs`
- `cleanup:reports` → `scripts/generate-cleanup-reports.mjs`
- `stabilization:reports` → `scripts/generate-stabilization-reports.mjs`

**Fix:** Remove scripts or restore files.

### 4.5 Debug / temporary code (prod-gated, do not delete without review)

| Route | Prod behavior |
|-------|---------------|
| `/api/debug/*` | 403/404 unless QA secret |
| `/internal/*` UI routes | `InternalRouteGuard` |
| `server/security/debugAccess.ts` | Gate logic |

---

## Phase 5 — Frontend simplification audit

### 5.1 Current state

**Good:** `ToolPageSeoFooter` collapses "How to use" + "Guide & FAQs" by default (`defaultValue={[]}`). `ToolKnowledgeHub` uses accordion — educational content hidden until click.

**Patterns in use:**

| Pattern | Tools | Upload → Process → Download focus |
|---------|-------|-------------------------------------|
| `MasterToolWorkspace` + desktop adapters | Cloud/hybrid tools on desktop | ✅ Strong |
| `SinglePdfToolShell` | OcrPdf, UnlockPDF, RotatePDF, etc. | ✅ Good; seo footer below |
| Custom large pages | MergePDF, PDFEditor, SignPdf | ⚠️ Variable |
| `MobileToolLayout` | ~40% of hero tools | ⚠️ Inconsistent sticky CTA |

### 5.2 Tools missing collapsible SEO footer (use shell or custom)

These tool files do **not** directly import `ToolPageSeoFooter` — may still get it via `SinglePdfToolShell` or `ToolRouteShell`:

- `WordToPdf`, `OcrPdf`, `ProtectPdf`, `UnlockPDF`, `RotatePDF`, `RedactPdf`, `PageNumbers`, `ChatPdf`, `AiSummarizePDF`, `RepairPdf`, `PdfToHtml`, `HardLockPdf`, `ConverterHub`

**Action:** Audit each — ensure footer is present via shell, not duplicated inline content above upload.

### 5.3 Clutter still visible by default (recommendations)

| Element | Recommendation |
|---------|----------------|
| `ToolTrustStrip` below accordion | Move inside collapsed section or reduce to one line |
| `ToolTechnicalSpecs` | Collapse by default |
| `SiteTrustBanner` on homepage | Keep — not on tool workspace |
| Long hero subtitles on mobile | Truncate to one line |
| `AiScanner.tsx` (7 ToolSEO refs) | Review duplicate meta renders |

---

## Phase 6 — UI consistency audit

### 6.1 Consistent (keep)

- Desktop: `GenericToolDesktopAdapter` → 3-column master shell
- Upload: `DropZone` / `MasterToolCenterPreview`
- Progress: `ProcessingPipeline`, `useEnhancedJob` progress 0–100
- Done state: `MasterToolDonePanel` with direct download (not Share-first)
- Errors: `cloudErrorCodes.ts` user messages
- Dark mode: Theme toggle + CSS variables

### 6.2 Inconsistencies

| Area | Issue |
|------|-------|
| Mobile sticky CTA | Not all tools use `MobileToolLayout` bottom bar |
| Progress indicators | Browser tools use local state; cloud uses job poll — different visuals |
| Upload zone sizing | Merge/Split vs Editor vs AI tools differ |
| Desktop vs mobile chrome | Desktop has sidebar; mobile has bottom nav — intentional but transition jarring on resize |
| Button labels | "Continue", "Process PDF", "Run Turbo Cloud" — unify copy |

---

## Phase 7 — Production readiness verification

### 7.1 Automated checks (2026-05-28 run)

| Check | Result |
|-------|--------|
| `validate-vercel-cron.mjs` | ✅ |
| `validate-production-env.mjs` | ✅ (local .env present) |
| `audit-routes.mjs` | ✅ 80 routes, 92 sitemap paths, 57 tools |
| `tsc --noEmit` | ✅ |
| `verify-pdfjs-worker-version.mjs --strict` | ✅ |
| `vitest run` | ❌ **No test files** — blocks full `audit:predeploy` |
| `qa:assert-prod` | Not reached |

### 7.2 Route integrity

- No broken sitemap ↔ route mismatches
- Dynamic routes: `[locale]/[[...path]]`, API dynamic segments
- Legacy root `app/` deleted; all APIs under `src/app/api/`

### 7.3 Runtime risks

| Risk | Severity | Status |
|------|----------|--------|
| CSP blocks R2 direct fetch | Was critical | ✅ Fixed via proxy |
| Worker callback apex mismatch | Medium | Normalized to www in backend config |
| Priority queue stuck jobs | Medium | Documented; env flag parity needed |
| `pdf-to-pdfa` cloud enqueue → worker error | Medium | Tool should disable cloud or implement pipeline |
| Zero unit tests | Medium | CI gate fails |
| `backend-service` version drift | High | Pin deploy SHA; E2E per pool |
| Download through Vercel for large files | Medium | Timeout/memory on edge |

### 7.4 Hydration / console

- `"use client"` on interactive tool pages — OK
- `react-helmet-async` for SEO — client-side meta (acceptable for SPA shell)
- No widespread `suppressHydrationWarning` abuse found

---

## Phase 8 — Final report summary

### 8.1 Pipeline map (condensed)

See §1.1–1.5 above. **Two upload stacks** by design:

1. **Browser staging:** `/api/r2/*` → local processing → optional delete
2. **Enhanced cloud:** `/api/enhanced/*` → Redis → Railway/AI → callback → same-origin download

### 8.2 Bottlenecks found

1. Vercel download proxy for large premium files
2. Mobile LCP / homepage JS weight
3. Client-trusted pageCount at enqueue
4. Sequential credit estimate before AI job
5. No automated unit test gate

### 8.3 Dead code to remove (recommended PR)

- **~45 frontend files** (legacy-vite-pages, unwired layout, orphan hooks/UI)
- **4 npm packages** (react-rnd, recharts, marked, date-fns)
- **2 backend pipeline files** (docx_premium, docling_optional)
- **Fix or remove 3 broken npm scripts**

**Estimated bundle impact:** Small (dead code mostly not in import graph). Legacy tree removal improves developer clarity significantly.

### 8.4 Redundant layers removed (already done in recent fixes)

- Direct R2 download disabled by default (`isDirectDownloadEnabled`)
- Enhanced upload proxy-only when key provided
- Share vs download split in `safeDownloadBlob`
- Word→PDF DOCX prep + PDF blank page strip

### 8.5 Performance improvements (recommended, not implemented)

| Priority | Change |
|----------|--------|
| P0 | Add minimal vitest smoke tests so `audit:predeploy` passes |
| P1 | Delete `legacy-vite-pages` + unwired shells |
| P1 | Remove unused deps (recharts, react-rnd) |
| P2 | Server-side page count from R2 at enqueue |
| P2 | Lazy-load mammoth/fabric/opencv per route |
| P3 | Debounce `refreshUsage()` after cloud jobs |
| P3 | Implement or disable `pdf-to-pdfa` cloud path |

### 8.6 Simplifications made (this audit)

- No code changes in this audit pass — **report only**
- Prior session fixes confirmed wired and stable

### 8.7 Risks detected

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | 3-repo deploy drift | Pin SHAs; run `qa:jobs-pools` after each backend push |
| R2 | `worker/` confusion | Delete or add README "deprecated" |
| R3 | No tests | Add 5–10 critical path tests (enhanced client, auth session) |
| R4 | pdf-to-pdfa gap | Set `supportsCloud: false` until implemented |
| R5 | Orphan requeue priority | Fix in backend-service consumer |

### 8.8 Recommended future optimizations

1. **Edge download:** Cloudflare Worker or R2 public bucket with short TTL signed cookies
2. **Unified upload API:** Single `/api/upload` with `context=staging|enhanced` (policy branching internal)
3. **Route split:** Extract `AppRoutes.tsx` properly; delete duplicate
4. **E2E matrix:** Playwright cloud smoke per pool (scripts exist: `qa:cloud-e2e`, `qa:jobs-pools`)
5. **Worker metrics:** Export queue depth + job duration to Supabase or Sentry
6. **Mobile parity:** 100% hero tools on `MobileToolLayout` with sticky CTA

---

## Appendix A — API route inventory

Full list: 47 routes under `src/app/api/`. See Phase 1 §1.2 or subagent map in `reports/system-architecture-summary.md`.

## Appendix B — Tool → processing mode matrix

See `constants/toolStatus.js`, `reports/tool-matrix.json`, `docs/WORLD_CLASS_AUDIT_2026.md` Phase 1 table.

## Appendix C — Existing reports cross-reference

| Report | Relevance |
|--------|-----------|
| `reports/360-AUDIT-EXECUTION-2026.md` | Prior execution |
| `reports/architecture-after-cleanup.md` | Post-cleanup state |
| `reports/remaining-risks.md` | Open risks |
| `reports/tool-matrix.json` | Browser vs cloud per tool |
| `docs/WORLD_CLASS_AUDIT_2026.md` | Competitor benchmark + scores |

## Appendix D — Cleanup execution checklist

When approved for implementation (separate PR):

- [ ] Delete `src/legacy-vite-pages/`
- [ ] Delete unwired `AppRoutes.tsx`, `LocaleDocumentFrame.tsx`
- [ ] Delete orphan hooks (3)
- [ ] Delete orphan UI scaffolds (7) + `recharts`, `react-rnd`
- [ ] Remove broken npm scripts or restore scripts
- [ ] Add deprecation notice or delete `worker/`
- [ ] Backend: delete `docx_premium.py`, `docling_optional.py`
- [ ] Disable cloud for `pdf-to-pdfa` until implemented
- [ ] Add minimal vitest tests
- [ ] Run `npm run audit:predeploy` green
- [ ] Redeploy Vercel (no pipeline logic change)

---

*Audit performed without modifying production pipeline logic. All cloud pipelines reported operational at audit start.*

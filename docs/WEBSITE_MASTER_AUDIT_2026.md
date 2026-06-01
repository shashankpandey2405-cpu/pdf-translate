# Website Master Audit — 2026-05-30

**Scope:** Performance, UI/UX, tool system, desktop/mobile, free-tier value, AI Resume readiness.  
**Method:** Static scans (`audit-tool-ux.mjs`, `audit:predeploy`), bundle baseline, documented Lighthouse history, manual matrix.

---

## Executive verdict

| Master prompt section | Verdict | Notes |
|----------------------|---------|-------|
| 1. Lighthouse 90+ | **FAIL** | Baseline mobile home Perf **~38** ([WORLD_CLASS_AUDIT_2026.md](./WORLD_CLASS_AUDIT_2026.md)). May 2026 pass: single-branch `ToolPageSplit`, deferred `HomeMasterHero`, lighter font — **re-run** `npm run audit:lighthouse` after build. |
| 2. UI/UX clean & premium | **PARTIAL** | 20/39 `MobileToolLayout`; 15/39 `ToolPageSplit`; **0** workspace `ToolHelpLinks` (desktop footer via `ToolRouteShell` only). See [PERF_SPRINT_LCP_2026.md](./PERF_SPRINT_LCP_2026.md). |
| 3. User experience | **PARTIAL** | Hero tools clear; Translate still uses `AiDocumentProcessingModal`; resume onboarding extra step. |
| 4. Tool system | **PARTIAL** | Generic `ToolPage` migrated; popups remain on Translate/sign-in Dialog. |
| 5. AI Resume Builder | **PASS** | Template → mode → AI intake → `/api/ai/resume` → studio edit → PDF. |
| 6. Credit system (AI resume) | **PASS** | `ai-resume-builder` in `AI_TOOL_SLUGS`; reserve/settle via credits ledger. |
| 7. Desktop + mobile | **PARTIAL** | Resume uses `ToolPageSplit` + `MobileToolLayout` (AI path); editor custom chrome. |
| 8. iOS download | **PASS** | Resume export uses `safeDownloadBlob`; 0 legacy `a.click()` on tool routes. |

---

## 1. Performance verification

### Automated checks (run)

```bash
npm run build:gate
npm run verify:opencv-chunk
npm run audit:tool-ux
npm run audit:predeploy
npm run audit:lighthouse   # requires npm start or LIGHTHOUSE_BASE_URL
```

### Bundle baseline (2026-05-29)

| Metric | Value | Gate |
|--------|-------|------|
| Total client JS | ~19.2 MB | ≤ 20 MB PASS |
| Largest chunk | OpenCV ~10.8 MB (async) | ≤ 6 MB per chunk PASS |
| Largest initial chunk | ~1.35 MB | Monitor |

Source: [reports/bundle-baseline.json](../reports/bundle-baseline.json)

### Lighthouse (mobile)

| URL | Perf | LCP | TBT | CLS | Verdict |
|-----|------|-----|-----|-----|---------|
| `/en` (documented) | ~38 | 8.9s | 2840ms | 0 | **FAIL** target 90+ |
| Tool routes (cited) | ~38 | — | — | — | **FAIL** |

**Target:** Performance, Accessibility, Best Practices, SEO ≥ 90; LCP &lt; 2.5s; TBT &lt; 200ms.

**Remediation backlog (ranked):**

1. Home LCP — defer providers, lazy below-fold ([src/App.tsx](../src/App.tsx))
2. Remove `framer-motion` from 11 tool routes (see [reports/tool-ux-audit.json](../reports/tool-ux-audit.json))
3. `ToolPageSplit` — consider single-breakpoint render for mobile-only DOM
4. Refresh `bundle-sizes.json` on each release build

---

## 2. UI/UX verification

Static scan: `reports/tool-ux-audit.json` (generated 2026-05-30)

| Metric | Count / 39 tools |
|--------|------------------|
| `MobileToolLayout` | 20 |
| `ToolPageSplit` | 15 |
| Workspace `ToolHelpLinks` | 5 |
| `framer-motion` | 10 |
| Legacy `a.click()` download | 0 |
| `AiDocumentProcessingModal` | 0 |

### Checklist sample (manual)

| Tool | Upload | Gear/rail options | Minimal workspace | safeDownload |
|------|--------|-------------------|-------------------|--------------|
| merge-pdf | PASS | PASS | PASS | PASS |
| compress-pdf | PASS | PASS | PASS | PASS |
| ToolPage (generic) | PASS | PASS | PASS | PASS |
| translate-pdf | PASS | PARTIAL (modal) | PASS | PASS |
| resume-builder | PASS | PASS (post-sprint) | PASS | PASS |
| pdf-editor | PASS | PASS | PARTIAL | PASS |

---

## 3. User experience

| Flow | Confusion risk | Mitigation |
|------|----------------|------------|
| Merge / Split | Low | Sticky CTA + file stack |
| Compress hybrid | Low | Gear + `HybridModeSheetPanel` |
| Translate | Medium | Tier/modal → migrate to gear |
| Resume | Medium → Low | Template → mode → manual/AI (this sprint) |
| AI tools | Medium | Sign-in + credit estimate before run |

**Free value:** Browser-local tools (merge, split, flatten, manual resume) remain usable without account.

---

## 4. Tool system audit

| Rule | Status |
|------|--------|
| Consistent upload (`ToolUploadSlot`) | PARTIAL — studio tools use custom upload |
| Right slide / gear panel | PASS on migrated tools |
| No popup for options | PARTIAL — Translate AI modal, ToolPage sign-in Dialog |
| Processing + result smooth | PASS on Tier A / hybrid heroes |
| `ProcessingModeModal` | Unused (dead code) — OK |

---

## 5. Desktop + mobile sign-off

| Route | Desktop | Mobile | Download | Auth (AI) |
|-------|---------|--------|----------|-----------|
| /merge-pdf | Master workspace | MobileToolLayout | safeDownload | N/A |
| /compress-pdf | Adapter | MobileToolLayout | safeDownload | Optional cloud |
| /resume-builder | Studio split | Mobile toolbar + layout | safeDownload | AI path signed-in |
| /pdf-editor | EditorDesktopChrome | Dock + upload shell | safeDownload | N/A |

**Resume mobile:** [MobileResumeToolbar.tsx](../src/components/resume/studio/MobileResumeToolbar.tsx) form/preview panes.

---

## 6. AI Resume Builder readiness

| Item | Status |
|------|--------|
| Template → mode picker | Implemented |
| AI intake form | Implemented |
| `/api/ai/resume` + credits | Implemented |
| Studio edit → PDF export | Implemented |
| `ai-resume-builder` in `AI_TOOL_SLUGS` | Implemented |

---

## Commands reference

| Script | Purpose |
|--------|---------|
| `npm run audit:tool-ux` | Static tool UX matrix → `reports/tool-ux-audit.json` |
| `npm run audit:lighthouse` | Mobile Lighthouse → `reports/lighthouse-*.json` |
| `npm run audit:predeploy` | Routes, typecheck, unit QA |
| `npm run build:gate` | Bundle size enforcement |

---

## Re-audit (post-implementation) — 2026-05-30

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run audit:predeploy` | PASS |
| `npm run audit:tool-ux` | PASS (20/39 mobile shell, 0 modal, 0 legacy download) |
| `npm run audit:lighthouse` | Run with `npm start` or `LIGHTHOUSE_BASE_URL` — scores in `reports/lighthouse-summary.json` |

**AI Resume manual QA:** `/resume-builder` → template → AI mode → fill intake (20+ char about) → sign in → generate → edit in studio → download PDF (verify on iOS Safari).

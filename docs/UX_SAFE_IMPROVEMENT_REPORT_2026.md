# PDFTrusted Safe UX & Performance Improvement Report

**Scope:** Frontend presentation only — no backend, API, processing, or AI pipeline changes.  
**Date:** 2026-05-30  
**Implementation:** `src/components/tools/ux/*`, `MobileToolLayout`, Merge/Compress/Split/Extract mobile, `DropZone`, `RouteFallback`, `HomeMasterHero`

---

## 1. UX Friction Report (user journey)

| Step | User sees first | Friction | Hesitation |
|------|-----------------|----------|------------|
| **1. Homepage** | Dark hero + 12 tool grid | Two CTAs similar weight; subtitle long | Which tool vs “Start free”? |
| **2. Select tool** | Chrome header OR full Navbar + tool title | Duplicate headers on some tools | Where is upload? |
| **3. Upload** | DropZone (variable height) | Trust banners above fold on Merge | Is upload safe? |
| **4. Configure** | Tool-specific (merge reorder, modes) | Hidden on mobile without scroll | Where is primary action? |
| **5. Processing** | Ring / AI animation | Empty feel if no skeleton | Is it stuck? |
| **6. Download** | Result panel or gear sheet | Download in rail on mobile | Where is download? |

### UX friction points (evidence)

1. **Duplicate navigation** — `Navbar` + tool title + `MobileToolChromeHeader` on non-migrated tools.  
2. **Trust stack before upload** — TrustShield + auditor panels push upload below fold (Merge mobile).  
3. **Inconsistent mobile shells** — Hero tools (Merge, Compress, Split, Extract) now on `MobileToolLayout`; remaining Tier B/C tools still migrating.  
4. **No step indicator** — User cannot see Upload → Process → Download at a glance.  
5. **PDF thumbnails on mobile arrange** — Scroll + layout shift (Merge).  
6. **Route fallback spinner** — No layout reservation → CLS on tool load.  
7. **DropZone height varies** — CLS when switching phases.

### UX clarity points (keep)

- Hybrid processing labels (browser vs cloud).  
- `ProcessingStatus` with `aria-live`.  
- Help Center off tool pages (desktop).  
- Mobile preview policy (less clutter).

### UX missing elements

- **Global “you are here” step bar** on mobile tools.  
- **Stable skeleton** for tool route code-split.  
- **Single primary CTA class** across tools.  
- **Collapsed trust UI** on mobile tool first screen.

---

## 2. UI inconsistency report

| Element | Variants found | Target |
|---------|----------------|--------|
| Primary CTA | Inline classes per file | `TOOL_PRIMARY_BTN` |
| Dropzone height | `min-h` varies | `TOOL_DROPZONE_MIN_H` |
| Mobile shell | Premium vs `MobileToolLayout` | `MobileToolLayout` for hero tools |
| Processing | Cinematic vs `ToolWorkflowShell` vs cloud panel | `ToolWorkflowShell` + skeleton |
| Success download | Inline vs gear sheet | `MobilePostProcessPanel` + rail |
| Error | `ToolErrorState` ✅ consistent | Keep |

---

## 3. Mobile UX issues

| Issue | Severity | Tools affected |
|-------|----------|----------------|
| Merge uses sidebar “How it works” in layout | Low | Hidden on small screens but main still busy |
| Arrange list with thumbnails | Fixed (pilot) | Merge — compact rows, no canvas thumbs on mobile |
| No sticky CTA on upload-only tools | Medium | Custom pages |
| Horizontal scroll risk | Low | Editor/sign only |
| Bottom safe-area | Fixed in `MobileToolLayout` | Partial |

---

## 4. Layout improvement suggestions (safe)

1. **`ToolWorkflowStepBar`** under mobile tool title — implemented.  
2. **Hide non-essential trust blocks** on `lg:hidden` tool pages — Merge pilot.  
3. **`ToolPagePremiumLayout`**: reduce mobile padding — use split without premium wrapper on mobile.  
4. **Compact file rows** without canvas thumbnails on mobile — Merge pilot.  
5. **Fixed min-heights** on upload and processing regions — implemented.

---

## 5. Performance perception improvements (frontend only)

| Change | Effect |
|--------|--------|
| `ToolRouteSkeleton` | Reserves viewport during lazy load |
| `TOOL_DROPZONE_MIN_H` | Reduces CLS on upload |
| `TOOL_PROCESSING_MIN_H` on shell | Stable processing block |
| `prefers-reduced-motion` on DropZone | Less jank, faster feel |
| Defer trust panels on mobile | Faster “time to upload” |

---

## 6. Safe frontend refactor plan

### Phase A — Done (this pass)

- [x] `toolUxClasses.ts` — shared tokens  
- [x] `ToolWorkflowStepBar`  
- [x] `ToolRouteSkeleton` + `RouteFallback`  
- [x] `DropZone` CLS + reduced motion  
- [x] `ToolWorkflowShell` processing min-height  
- [x] `MobileToolLayout` optional step bar  
- [x] `SinglePdfToolShell` step bar  
- [x] `MergePDF` mobile → `MobileToolLayout` + compact arrange  
- [x] Homepage micro-copy (flow hint)

### Phase B — 1–3 days (no backend)

- [ ] Compress, Split, Extract → `MobileToolLayout` + step bar  
- [ ] `TOOL_PRIMARY_BTN` replace in top 10 tools  
- [ ] Hide `ToolHeader` on mobile when chrome header active  
- [ ] Auto-open gear sheet on `done` for all shells using `MobilePostProcessPanel`

### Phase C — 1–2 weeks

- [ ] Framer-motion → CSS on tool hot paths only  
- [ ] `ToolWorkspaceFrame` wrapper for all Tier B tools  
- [ ] Tablet breakpoint QA (768–1024)

---

## 7. Scoring (expected impact)

| Item | Impact | Difficulty | Risk |
|------|--------|------------|------|
| Step bar | 8 | 2 | 1 |
| Merge mobile layout | 9 | 5 | 2 |
| Route skeleton | 7 | 2 | 1 |
| DropZone stable height | 7 | 2 | 1 |
| Trust hide mobile | 6 | 3 | 1 |

---

*All changes must pass `npm run typecheck` and avoid edits under `server/`, `src/app/api/`, and `*/logic.ts` processing files.*

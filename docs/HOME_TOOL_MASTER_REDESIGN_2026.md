# Home + Tool System Master Redesign — Audit & Implementation Log

**Date:** 2026-05-30  
**Scope:** Frontend UX + performance alignment with Master Prompt (Lighthouse-first, minimal clutter, slide-panel tools).

---

## Executive summary

| Area | Before | After this pass |
|------|--------|-----------------|
| Home hero CTAs | 2 buttons, “Start for Free”, duplicate Explore | **3 CTAs:** Start Free Trial · Premium Coming Soon · Explore |
| Home pricing leaks | Footer `/pricing`, FAQ credits/Premium tiers | Footer shows Coming Soon on home; FAQ copy usage-based |
| Language (home) | Mobile only in `HomeLightNav` | **All breakpoints** in home nav + desktop tool nav (prior pass) |
| Tool upload (Tier A) | Raw `DropZone`, duplicate file UI | **`SinglePdfToolShell` → `ToolUploadSlot`** (10 tools) |
| Tool help clutter | `ToolHelpLinks` in mobile/desktop footers | **`ToolRouteShell` footer desktop-only**; shell footer removed |
| Tool compliance | 1 / 45 compliant | **~11 partial improvements**; **44 still need full rail migration** |

---

## Home page — master prompt checklist

| Rule | Status |
|------|--------|
| Simple welcome, no heavy motion | ✅ Dark hero, CSS-only hovers |
| Start Free Trial (primary) | ✅ Label + `/login?next=/all-tools` |
| Premium — no price, Coming Soon 1 July | ✅ `HomePremiumComingSoonCta` (no `/pricing`) |
| Explore | ✅ Single CTA (removed duplicate bottom bar) |
| 10–12 popular tools, minimal grid | ✅ 12 tools in `homeMasterGrid.js` |
| No pricing on home | ✅ Hero clean; footer pricing → coming soon on home |

### Files changed (home)

- `src/components/home/HomeMasterHero.tsx`
- `src/components/home/StaticHomeMasterHero.tsx`
- `src/components/home/HomePremiumComingSoonCta.tsx` (new)
- `src/components/home/HomeLightNav.tsx`
- `src/components/home/homeMasterDefaults.ts`
- `src/locales/en.json` (`home.master`, `home.faq`)
- `src/data/seo/homeFaqs.ts`
- `src/components/Footer.tsx`

---

## Tool system — compliance matrix

### ✅ Reference implementation

- **Merge PDF** — `ToolPageSplit`, `ToolMultiFileStack`, `MasterToolWorkspace`, `MobileToolLayout`, `safeDownloadBlob`

### ✅ Improved this pass (partial → closer)

- **SinglePdfToolShell** (10 tools): `ToolUploadSlot`, no workspace `ToolHelpLinks`
- **Organize / Remove** (batch 3): mobile shell + sticky CTA
- **Extract / Split / Compress / Merge** (prior batches): mobile shell, monotonic progress
- **Ai Scanner / Document Scanner**: minimal workspace
- **Sign Pro upload**: `fileToSignaturePngDataUrl`, mobile file picker fix
- **Batch 6 (done):** `FlattenPdf`, `PdfToPdfa`, `SmartScanAi`, `AiQuestionGenerator` — `ToolPageSplit`, `ToolUploadSlot`, mobile gear/sticky CTA, `safeDownloadBlob` / `shareBlob` on results; workspace `ToolHelpLinks` removed
- **Batch 7 (partial):** `safeDownloadBlob` on `ToolPage`, `CompressPDF`, `PDFToWord`, `TranslatePDF`, `PhotoResizer`, `WatermarkRemover`, `AiScanner`; generic **`ToolPage`** → `ToolPageSplit` + `MobileToolLayout` mobile shell
- **Repair PDF (advanced):** multi-pass engine (pdf-lib → MuPDF → page rebuild), Quick/Deep modes, repair report UI
- **PDF Editor:** selection **Properties** inspector (position, size, opacity, stroke) on right panel

### ❌ Still needs migration (priority order)

1. **`ProcessingModeModal` → gear/rail** — remaining hybrids (TranslatePDF uses gear mode buttons)  
2. **Chat PDF, Universal Converter, PDF to Image** — full desktop adapter parity  
3. **PDF Editor pro chrome** — denser toolbar groups, form designer, measurement (reference: Acrobat-style)  
4. **Remaining `a.click()`** — `Download.tsx`, resume studio, internal smoke tests  

---

## Global rules — add-on checklist

| Rule | Status |
|------|--------|
| Language desktop (Premium left) | ✅ `DesktopTopNav` |
| Language mobile tools | ✅ `MobileToolChromeHeader` + home `HomeLightNav` |
| No fixed “10 credits” on tool UI | ✅ Translate/OCR subtitles; home FAQ; more auth copy remains in login modals (out of tool workspace) |
| One login, session persistent | ✅ `useAuthSession` on desktop nav (prior pass) |
| No popups for tool options | ⚠️ `ProcessingModeModal`, `AiDocumentProcessingModal`, editor `Dialog`s remain |
| Right slide panel + gear | ✅ Pattern in `MasterToolWorkspace` + `MobileToolLayout` |
| iOS/Android download | ✅ `safeDownloadBlob` in result panels; audit remaining raw downloads |
| No “How to use” on tool workspace | ⚠️ Many tools still have desktop sidebar/footer help — hide on `lg:hidden` tool routes next |

---

## Performance (Lighthouse) notes

- Home: SSR `StaticHomeMasterHero` + hydrate swap; below-fold lazy (`HomeTrustFaq`, `HomeExploreMore`)
- Tools: code-split routes; prefer `ToolPageSplit` to avoid double DOM
- Avoid re-mounting `HomePremiumShowcase`, `HomeHero` (contains `$9.99` pricing)
- Target: keep LCP on home hero text + CTA; defer FAQ accordion

### Recommended next perf pass

1. Align `HomePageSkeleton` with `home-master` dark layout  
2. Remove `framer-motion` from hot tool paths (Compress mobile still uses AnimatePresence)  
3. Preload only Merge/Compress chunks from home grid (`modulepreload` selective)  

---

## Component plan (target architecture)

```
Home
├── StaticHomeMasterHero (SSR)
├── HomeMasterHero (client)
│   ├── HomeLightNav (lang + premium chip)
│   ├── 3 CTAs
│   └── HOME_MASTER_TOOLS grid
└── lazy: HomeTrustStrip, HomeTrustFaq, HomeExploreMore

Tool (standard)
├── ToolPageSplit
│   ├── desktop: GenericToolDesktopAdapter → MasterToolWorkspace
│   │   ├── center: ToolUploadSlot | preview | processing | result
│   │   └── rightPanel: options (DesktopToolStepPanel + extraOptions)
│   └── mobile: MobileToolLayout
│       ├── gear sheet: settingsPanel
│       ├── sticky: processButton
│       └── postProcess: MobilePostProcessPanel (download + share)
```

---

## Credit & billing UX (future-ready)

- **Do not show** fixed “10 / 20 credits” on tool pages  
- Use `CreditUsageBadge` only when signed in + dynamic balance API exists  
- Home/marketing: “usage-based” / “pay for what you run”  
- Premium: **Coming Soon 1 July** until launch — no `/pricing` on home  

---

## Verification commands

```bash
npm run typecheck
npm run build
# Lighthouse: home `/`, tool `/merge-pdf`, `/tools/ai-scanner`, `/sign-pdf`
```

---

## Remaining work estimate

| Batch | Tools / area | Effort |
|-------|----------------|--------|
| 4 | Replace `ProcessingModeModal` with rail selection | Medium |
| 5 | PDF Editor + Sign + Watermark minimal chrome | Large |
| 6 | Generic `ToolPage.tsx` + 7 slugs | Medium |
| 7 | Download audit (`safeDownloadBlob` everywhere) | Small–medium |

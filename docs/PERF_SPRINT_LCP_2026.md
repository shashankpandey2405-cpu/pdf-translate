# Performance sprint — LCP / TBT (May 2026)

Safe, incremental changes toward Lighthouse **90+** on home and tool routes. Full 90+ still needs a dedicated run with `npm run audit:lighthouse` against a production build.

## Shipped in this pass

| Change | Target metric |
|--------|----------------|
| `ToolPageSplit` — single branch after hydrate (`useIsLgDesktop`) | TBT on tool routes (no duplicate mobile+desktop trees) |
| `HomeMasterHero` — `dynamic({ ssr: false })` | Home JS / TBT (SSR `StaticHomeMasterHero` stays LCP) |
| Inter font `400` + `600` only, `adjustFontFallback` | LCP (font bytes) |
| Removed `framer-motion` from `PDFToImage`, `PDFToWord`, `UniversalConverter`, `PhotoResizer` | TBT |
| Removed workspace `ToolHelpLinks` from 5 tools | UX audit PARTIAL → PASS workspace |

## How to measure

```bash
npm run build
npm run start
# other terminal:
npm run audit:lighthouse
```

Reports: `reports/lighthouse-*.json`. Gate suggestion: perf ≥ 70 before deploy; 90+ = follow-up sprint.

## Sprint 2 (May 2026) — completed

- **39/39** tools pass mobile shell audit (`npm run audit:tool-ux`)
- **34/39** `ToolPageSplit` (AI routes split in workspace components)
- **0** `framer-motion` in `src/route-pages/tools`
- `MergeFileReorderList` replaces framer `Reorder` on merge
- `SinglePdfToolShell` uses `ToolPageSplit` + no motion
- Lighthouse script: deploy gate **perf ≥ 70** on home (`LIGHTHOUSE_DEPLOY_MIN_PERF`), stretch **90** (`LIGHTHOUSE_TARGET_PERF`); `LIGHTHOUSE_STRICT=1` exits non-zero on fail

## Next (90+ dedicated pass)

- Run `npm run build && npm start` then `npm run audit:lighthouse`
- Add `ToolPageSplit` to `ChatPdf.tsx` / `AiSummarizePDF.tsx` route files (optional — already in workspace)
- `CompressPDF`, `TranslatePDF`, `SignPdf`, `PDFEditor` — inline `ToolPageSplit` at route level
- Home LCP: further defer providers / marketing motion on non-tool pages

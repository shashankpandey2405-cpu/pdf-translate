# PDFTrusted Ultimate 360° Deep Project Audit

**Audit date:** 2026-05-30  
**Repository:** `pdftrusted` (Next.js 15 + Vite SPA shell + `src/app/api`)  
**Method:** Static codebase analysis, `reports/*`, `npm run audit-routes`, `npm run qa:trust-copy`, cross-read of `docs/WORLD_CLASS_AUDIT_2026.md`, `docs/TOOL_PAGE_MIGRATION_REPORT_2026.md`, `docs/COMPLIANCE_AUDIT_2026.md`, `docs/TRUST_LEGAL_SAFETY_AUDIT_2026.md`.  
**Not run in this pass:** Fresh Lighthouse on production URL, live penetration test, load test at millions QPS.

**Audience:** Senior engineering, enterprise buyers, investors, technical due diligence.

---

## 1. Executive Summary

PDFTrusted is a **production-grade hybrid PDF platform**: browser WASM/pdf-lib/pdf.js for privacy-first workflows, Vercel API gateway + Upstash Redis + Cloudflare R2 + Railway/Python `backend-service` for OCR/office/compress, and a Node AI pipeline (OpenRouter/vision) for chat, summarize, translate, and smart scan.

### Overall maturity score (evidence-weighted)

| Dimension | Score /100 | Confidence |
|-----------|------------|------------|
| Architecture & backend | **84** | High — code + queue contract reviewed |
| Tool correctness (browser) | **78** | Medium — matrix QA 38/38 routes 200 locally |
| Tool correctness (cloud) | **72** | Medium — external worker repo drift risk |
| Desktop UX / design system | **76** | High — partial right-rail rollout |
| Mobile UX | **71** | Medium — chrome header + ~20% `MobileToolLayout` coverage |
| Performance (mobile LH) | **52** | High — prior audit LCP ~8.9s mobile |
| SEO architecture | **88** | High — help/guides/faq/learn + sitemaps |
| Security | **80** | High — HMAC callbacks, guards; gaps on CSP/AI limits |
| Privacy / trust copy | **82** | High — post-2026-05-28 legal pass |
| Accessibility | **74** | Medium — 44px targets in footer; uneven ARIA |
| Maintainability | **70** | Medium — dual shells, framer-motion breadth |
| Enterprise readiness | **65** | Medium — no SSO, no account delete API, no SOC2 |

**Composite (weighted): ~78/100** — strong indie/SMB product; not yet enterprise-MSSP grade without ops and compliance hardening.

### Top 5 strengths (verified)

1. **Hybrid honesty** — `toolProfiles.ts`, `trustCopy.ts`, Processing Mode UI label browser vs Turbo Cloud.  
2. **Help Center split** — tool pages conversion-focused; 51 SEO bundles → `/guides` + `/faq` (migration report).  
3. **Cloud job safety** — worker HMAC, output key checks, staging purge cron, credit holds (WORLD_CLASS audit).  
4. **Route/sitemap integrity** — 89 app routes, 9 sitemaps, 200 paths; `audit-routes` OK.  
5. **Trust/legal remediation** — subprocessors in Privacy Policy, `qa:trust-copy` high=0, footer legal links.

### Top 5 risks (verified)

1. **`backend-service` external repo** — version skew breaks OCR/Word/compress silently.  
2. **Mobile performance** — Lighthouse Performance ~38 on tool routes (documented May 2026).  
3. **UX fragmentation** — three tool shells (SinglePdf, Premium, custom) × incomplete mobile/desktop parity.  
4. **Build quality gates off** — `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` in `next.config.mjs`.  
5. **Privacy product gaps** — no in-app account deletion; cookie banner inactive without GA env.

### Unique vs competitors

- **AI chat + smart scan reconstruction** vs iLovePDF/Smallpdf basic OCR.  
- **Browser-first default** with explicit cloud opt-in vs upload-everything competitors.  
- **Independent positioning** — credible for privacy-conscious users; weaker on brand trust vs Adobe.

---

## 2. Architecture Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Client (Next.js + Wouter SPA in src/App.tsx)                           │
│  • 7 locales • Theme • i18n • PWA • Sentry • optional GA (consent)      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────────┐
│  Vercel — src/app/api (~47 route.ts files)                                │
│  auth • enhanced/jobs • presign • multipart • credits • PayPal • AI     │
│  cron/r2-staging-purge • internal/ai-process • webhooks                   │
└───────┬─────────────────┬──────────────────┬────────────────────────────┘
        │                 │                  │
        ▼                 ▼                  ▼
   Supabase          Upstash Redis      Cloudflare R2
   (auth, jobs,      (queues, rate      (staging I/O)
    credits)          limits)
        │                 │
        │                 ▼
        │         Railway / Render workers (backend-service)
        │         pools: ocr | docx | compress | office | convert | security
        │                 │
        └─────────────────┴──► Node AI worker (server/ai/*, OpenRouter)
```

### Codebase scale (2026-05-30 scan)

| Metric | Value | Source |
|--------|-------|--------|
| Files under `src/`, `server/`, `constants/` | **939** | filesystem count |
| Catalog tools | **46** | `constants/tools.js` → `TOOL_SLUGS` |
| Rich SEO bundles | **51** | `toolSeoBundles.ts` |
| Wouter/App routes | **89** (80 static, 9 dynamic) | `scripts/audit-routes.mjs` |
| Sitemap base URLs | **200** (9 XML files) | same |
| API route handlers | **~47** | `src/app/api/**/route.ts` |

### Key directories

| Path | Role |
|------|------|
| `src/app/` | Next layout, API routes, SSR locale pages |
| `src/route-pages/` | Tool & marketing page implementations |
| `src/components/desktop/` | Master tool workspace, right slide panel, adapters |
| `src/components/mobile/` | MobileToolLayout, chrome header, AI preview modal |
| `src/lib/processing/` | `toolProfiles.ts`, cloud job options, errors |
| `server/enhanced/` | Redis queue, presign limits, usage |
| `server/ai/` | AI processor, queue worker, guardrails |
| `server/payments/` | PayPal checkout, entitlements |
| `constants/tools.js` | Nav, limits, tool groups |

### Processing tiers (`toolProfiles.ts`)

| Tier | Count (configured) | Examples |
|------|-------------------|----------|
| `browser_only` | ~28 default | merge, split, rotate, flatten, compare |
| `hybrid` + cloud | 9 | compress, pdf-to-word, protect, unlock, redact, pdf-to-image* |
| `cloud_only` | 4 | ocr-pdf, word-to-pdf, pptx-to-pdf, pdf-to-pptx |
| `hybrid` AI + cloud | 5 | chat-pdf, ai-summarize, translate-pdf, smart-scan-ai, ai-question-gen |

---

## 3. Frontend Audit

### What users see (walkthrough-style)

**Home (`/`)**  
- Master hero (static SSR + hydration), 12-tool grid, light nav; global Navbar/BottomNav hidden on home.  
- Below-fold deferred: trust, features, blog — good for LCP if hero stays lean.

**Tool routes (`/{locale}/{tool}`)**  
- **Desktop (lg+):** `DesktopTopNav` + mini sidebar + center workspace + `ToolRightSlidePanel` (gear) on adapted tools.  
- **Mobile:** `MobileToolChromeHeader` (logo, lang, search, tools); footer hidden on tools; bottom nav hidden on tools; workspace + sticky CTA via `MobileToolLayout` on subset.

**Help / SEO content**  
- `/help`, `/guides/{slug}`, `/faq/{slug}`, `/learn/{topic}` — educational content moved off tool pages (migration complete).  
- Tool pages: `ToolHelpLinks` desktop only (hidden mobile).

**Legal**  
- Privacy, Terms, Cookie, Disclaimer, Refund, Security, Privacy Center (+ rights block), About (+ compliance section).

### UX bottlenecks (evidence)

| Issue | Impact | Evidence |
|-------|--------|----------|
| Three tool shell patterns | Cognitive inconsistency | Tier A/B/C/D migration report |
| PDF Editor / Sign fullscreen | Different chrome | `isDesktopToolRoute` excludes them |
| Command palette + mega menu | Power users only; hidden on mobile tools | `App.tsx` |
| Processing mode modal | Extra step before cloud | `ProcessingModeModal` — necessary but friction |
| framer-motion on ~90 files | Jank on low-end mobile | ripgrep count |

### Visual consistency

- **Strong:** Navy/violet brand, glass panels, `GlassPanel`, desktop master workspace.  
- **Weak:** Legacy tool pages (Watermark, Editor) still custom layouts; motion-heavy success states.

---

## 4. Mobile Experience Audit

### Simulated flows (iPhone / Android logical model)

| Stage | Target UX | Current state |
|-------|-----------|---------------|
| Land on tool | Header + upload visible ≤1 viewport | ✅ Chrome header; ⚠️ tools without `MobileToolLayout` use full Navbar history |
| Upload | 1 tap DropZone | ✅ |
| Configure | Options in right sheet | ⚠️ ~9 tools + `SinglePdfToolShell`; others inline clutter |
| Process | Visible progress | ✅ `ProcessingStatus`, `AiProcessingSteps` on AI tools |
| Download | Sticky CTA or gear rail | ✅ `actionsPlacement="rail"` on shells |

### Tools using `MobileToolLayout` (verified files)

- SinglePdfToolShell (10 Tier A tools)  
- Smart Scan, Chat summarize workspace, Translate, Flatten, Compare, PdfToPdfa, Ai Question Gen  

**~46 catalog tools → ~40% explicit mobile shell** (WORLD_CLASS audit aligned).

### Mobile-specific wins (2026-05)

- Preview disabled except AI modal (`previewPolicy.ts`).  
- No tool footer SEO on mobile.  
- No site footer on tool routes.

### Mobile friction

| Finding | Severity | Taps / scroll |
|---------|----------|----------------|
| Merge/Compress/Split custom pages | High | Extra scroll vs MobileToolLayout |
| PDF Editor mobile | High | Heavy canvas; not in mobile master prompt |
| Lighthouse mobile P ~38 | Critical | Slow first paint → abandonment |
| Keyboard overlap | Medium | `useVisualViewportKeyboardInset` exists — verify AI chat |

**Goal score (Upload→Download):** **7/10** on shell-adopted tools, **5/10** on legacy custom tools.

---

## 5. Desktop Audit

### Strengths

- `ToolRightSlidePanel` + gear: settings, download, post-process (Merge adapter pilot).  
- `GenericToolDesktopAdapter` + `BrowserToolDesktopAdapter` pattern emerging.  
- `DesktopMiniSidebar` on AI tools.  
- Help links at bottom on desktop only.

### Gaps

- Right rail not on all Tier B tools (Merge has adapter; Split/Organize/Extract per migration report still pending).  
- `PremiumSlidePanel` + upsell modals — conversion good, clutter risk.  
- Dual nav: `DesktopTopNav` + mini sidebar — acceptable for power users.

**Desktop goal score: 8/10** for hero tools with adapter; **6/10** catalog-wide.

---

## 6. Tool-by-Tool Audit (summary matrix)

**Legend:** Shell = implementation wrapper | M = MobileToolLayout | D = Desktop adapter/rail | Cloud = primary path

| Slug | Shell | M | D | Cloud | Workflow | Competitive note |
|------|-------|---|---|-------|----------|----------------|
| merge-pdf | B + adapter | Partial | ✅ | Browser | Strong | Parity with Sejda; drag order |
| compress-pdf | B custom | Partial | Partial | Hybrid | Good | vs Smallpdf: AI tier unique |
| split/extract/remove/organize | B | ❌ | Partial | Browser | Good | Standard |
| pdf-to-word | A | ✅ | Partial | Hybrid | Good | vs iLove: cloud docx v4 |
| ocr-pdf | A | ✅ | Partial | Cloud only | Good | SEO fixed “browser” claim |
| chat-pdf / ai-summarize | C | ✅ | ✅ | Cloud AI | Strong | Rare vs competitors |
| smart-scan-ai | D | ✅ | ✅ | Cloud AI | Strong | Differentiator |
| pdf-editor | Custom | ❌ | Fullscreen | Browser | Complex | vs Acrobat: lighter |
| sign-pdf | Custom | ❌ | Fullscreen | Browser | Good | Niche |
| flatten/compare | D | ✅ | ❌ | Browser | Good | Honest browser copy OK |
| word-to-pdf | A | ✅ | Partial | Cloud | Good | |
| translate-pdf | C | ✅ | Partial | Cloud AI | Good | |
| document-scanner | D | ❌ | ❌ | Browser+OpenCV | Good | Heavy chunk |
| universal-converter | D | ❌ | ❌ | Mixed | Medium | Hub complexity |

**Missing vs Adobe/Smallpdf:** batch enterprise API, e-sign legally binding, team workspaces, desktop app, redaction legal certification, PDF standards validation UI.

**Unnecessary complexity:** duplicate SEO aliases for smart scan; internal debug routes in production builds if env wrong; multiple comparison blog claims.

**Simplification opportunity:** one `ToolWorkspace` component → 3 shells collapsed to props.

---

## 7. Performance Audit

### Lighthouse (cited from `docs/WORLD_CLASS_AUDIT_2026.md`)

| Surface | Performance | A11y | BP | SEO | Notes |
|---------|-------------|------|-----|-----|-------|
| Mobile tool route | **~38** | — | — | — | LCP ~8.9s cited |
| Home (optimized pass) | Target 95+ | Target 100 | — | — | Static hero path |

*Re-run on production after deploy: `npx lighthouse https://pdftrusted.com/en/compress-pdf --preset=mobile`*

### Bundle (`reports/bundle-sizes.json`)

- Post-build snapshot shows **112 KB** client JS labeled `polyfills.js` only — likely incomplete analysis artifact; use `npm run analyze` for real chunk map.  
- `next.config.mjs`: async chunks for `pdfjs-dist`, `pdf-lib`, `fabric`, `mupdf` — **good**.

### Findings ranked

| ID | Issue | Sev | Impact est. | Fix |
|----|-------|-----|-------------|-----|
| P1 | Mobile LCP / main-thread | Critical | +40 LH perf | Defer framer-motion on tools; reduce home JS |
| P2 | OpenCV/document-scanner chunk | High | -1–2 MB on route | Route-only dynamic import (verify `opencv-chunk-audit`) |
| P3 | pdf.js worker load | High | TTI on first PDF | Already public worker; preload only on tool |
| P4 | Hydration home hero | Medium | CLS | `data-home-hydrated` pattern — keep |
| P5 | `ignoreBuildErrors` | Medium | Ship type bugs | Enable in CI gate only |
| P6 | Sentry replay prod | Low | Bytes | Sample rate already low |

---

## 8. SEO Audit

### Strengths (verified)

- Split sitemaps: home, tools, products, blog, compare, help, learn, info, ai-tools.  
- **51** tool bundles → JSON-LD via `ToolSEO` (SoftwareApplication, FAQ, HowTo).  
- Help Center **700 URLs** cited in migration report (`sitemap-help.xml`).  
- Compare hub + blog country posts (India, UK, etc.).  
- `audit-routes`: tool hrefs routable.

### Risks

| Risk | Severity | Evidence |
|------|----------|----------|
| JSON-LD FAQ on tool URL while body FAQ moved | Low | Intentional — no duplicate visible body |
| Blog competitor stats unverified | Medium | Pricing/feature claims in `posts.ts` |
| `100% browser` SEO on browser-only tools | Low | OK for flatten/compare |
| Thin learn pages if stubs | Medium | Verify each `/learn/*` word count |
| `seo-scan.json` empty hits | — | Run `scripts` SEO scan in CI |

### Recommendations

| Action | Impact | Difficulty |
|--------|--------|------------|
| Internal link Help → tools from hub only | Med | Low |
| GSC submit all 9 sitemaps post-deploy | High | Low |
| Add `lastmod` discipline in generator | Med | Low |
| Remove unverifiable superlatives in bundles | Med | Med (`qa:trust-copy`) |

---

## 9. Security Audit

### Implemented (verified)

| Control | Location |
|---------|----------|
| HTTPS + HSTS | `next.config.mjs` headers |
| X-Frame-Options SAMEORIGIN | same |
| X-Content-Type-Options nosniff | same |
| Referrer-Policy strict | same |
| Permissions-Policy camera self | same |
| API bot guard + burst limit | `server/security/apiGuard.ts`, `botGuard.ts` |
| Worker callback HMAC | `server/enhanced` / WORLD_CLASS audit |
| Presign limits | `server/enhanced/presignLimits.ts` |
| Sentry PII scrub | `sentry.shared.ts` |
| QA mode blocked in prod build | `next.config.mjs` throw |

### Gaps

| ID | Finding | Severity |
|----|---------|----------|
| S1 | **No Content-Security-Policy** header | High |
| S2 | Debug routes `/api/debug/*` if enabled in prod | High |
| S3 | AI routes rate limit uneven vs presign | Medium |
| S4 | Magic bytes at enqueue not presign | Medium |
| S5 | `typescript.ignoreBuildErrors: true` | Medium |
| S6 | Client `pageCount` trust at enqueue | Medium |
| S7 | Download proxy large files via Vercel | Medium |
| S8 | Dependency surface (~80+ prod deps) | Low |

### XSS / injection

- React default escaping — good.  
- `dangerouslySetInnerHTML` — grep periodically (not expanded in this pass).  
- PDF parsing in browser — supply-chain via pdf.js/pdf-lib — keep versions pinned (`verify-pdfjs-worker-version.mjs`).

---

## 10. Privacy Audit

**Full detail:** `docs/COMPLIANCE_AUDIT_2026.md`, `docs/TRUST_LEGAL_SAFETY_AUDIT_2026.md`.

### Verified controls

- Privacy Policy + subprocessors section (2026-05-28).  
- Cookie consent + `hasAnalyticsConsent()` gating GA.  
- AdSense hardcoded off.  
- R2 staging purge cron.  
- Privacy Center rights + contact path.  
- `npm run qa:trust-copy` → **0 high** issues.

### Gaps

| Gap | Severity |
|-----|----------|
| No self-service account deletion | High |
| Cookie banner off without GA env | Medium |
| AI subprocessors named but DPA not in UI | Medium |
| Locale parity incomplete | Low |

---

## 11. Accessibility Audit

### Positive

- Footer links `min-h-[44px]` (`Footer.tsx`).  
- `sr-only` labels on language selects.  
- Focus rings on Radix components.  
- `role="dialog"` on cookie banner.

### Gaps

| Issue | WCAG impact |
|-------|-------------|
| PDF canvas editor keyboard | Editor likely partial |
| Motion without `prefers-reduced-motion` sweep | 2.3.3 |
| Color contrast on muted tool helper text | 1.4.3 — spot check |
| Live regions for processing % | 4.1.3 — verify `ProcessingStatus` |
| Mobile sticky CTA under safe-area | Good — `env(safe-area-inset-*)` |

**Target:** axe-core on 5 hero tools in CI.

---

## 12. Dependency Audit

**Prod dependencies:** ~80+ direct (npm ls depth 0 truncated at 45 lines).

| Package | Purpose | Risk / note |
|---------|---------|-------------|
| `pdfjs-dist` / `pdf-lib` | Core PDF | Large async chunks — OK |
| `fabric` | Editor | Heavy — isolate |
| `mupdf` | Advanced render | Heavy |
| `@supabase/*` | Auth/data | Keep updated |
| `@aws-sdk/client-s3` | R2 | Standard |
| `@sentry/nextjs` | Monitoring | Required |
| Radix UI (20+ packages) | UI | Bundle — consider consolidation |
| `framer-motion` | Animation | Mobile cost — reduce |
| `next` 15 | Framework | Core |

**Dead/redundant:** run `depcheck` — not executed here.  
**Outdated:** `npm outdated` — recommend quarterly.  
**Extraneous:** `@emnapi/*` marked extraneous in npm ls — investigate lockfile.

---

## 13. Architecture Audit

### Scalability

- **Horizontal:** Redis queues + multiple Railway pools — scales for SMB burst.  
- **Bottleneck:** Vercel download proxy, AI on same gateway, Supabase connection limits.  
- **Millions of users:** needs CDN edge for static only; move heavy download to signed R2 redirect (partially exists).

### Technical debt

| Debt | Priority |
|------|----------|
| Dual routing Next + Wouter | Medium — document ownership |
| 3 tool shells | High — unify |
| External `backend-service` | Critical ops |
| `ignoreBuildErrors` | High CI |
| Duplicate API paths Windows vs posix | Low |

### Ideal target architecture (12 months)

```
ToolWorkspace (props: tier, mobile, rail)
  → ProcessingOrchestrator (browser | cloud | ai)
  → Unified ResultPanel
API: BFF layer with Zod validation + CSP
Workers: versioned contracts in monorepo or OpenAPI
Observability: SLO dashboards per pool
```

---

## 14. Competitive Analysis

| Capability | PDFTrusted | Adobe Online | Smallpdf | iLovePDF | Sejda | PDFgear | TinyWow |
|------------|------------|--------------|----------|----------|-------|---------|---------|
| Browser-first merge/split | ✅ | Partial | ❌ | ❌ | ✅ | ✅ | ✅ |
| AI chat PDF | ✅ | Limited | ❌ | ❌ | ❌ | ❌ | ❌ |
| Smart scan reconstruct | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OCR cloud quality | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E-sign legal | Basic | ✅ | ✅ | ✅ | ✅ | Partial | ❌ |
| Team/enterprise | ❌ | ✅ | ✅ | ✅ | Paid | ❌ | ❌ |
| Brand trust | Growing | ✅ | ✅ | ✅ | Medium | Medium | Low |
| Price | Freemium | High | Sub | Sub | Sub | Free+ | Free |

**Differentiation to protect:** hybrid privacy story + AI suite in browser tab.  
**Do not claim:** “better than Adobe” globally — use feature-specific comparisons with disclaimers.

---

## 15. Quick Wins (1–3 days)

| # | Action | Impact | Difficulty | Risk | Benefit |
|---|--------|--------|------------|------|---------|
| Q1 | Enable `tsc --noEmit` in `audit:predeploy` only (already there) — **remove** `ignoreBuildErrors` for prod branch | 8 | 3 | 4 | Fewer prod bugs |
| Q2 | Roll `MobileToolLayout` to Merge, Compress, Split | 9 | 4 | 2 | +mobile conversion |
| Q3 | Add CSP report-only header | 7 | 4 | 3 | Security DD |
| Q4 | Run Lighthouse CI on 3 URLs; track in `reports/` | 8 | 2 | 1 | Perf baseline |
| Q5 | `depcheck` + remove extraneous emnapi | 5 | 2 | 1 | Cleaner installs |
| Q6 | GSC: submit 9 sitemaps | 7 | 1 | 1 | Indexation |

---

## 16. High Impact (1–4 weeks)

| # | Action | Impact | Difficulty | Risk | Benefit |
|---|--------|--------|------------|------|---------|
| H1 | Unify Tier B tools on `GenericToolDesktopAdapter` + right rail | 9 | 7 | 3 | UX + maintainability |
| H2 | Mobile: 100% hero tools on `MobileToolLayout` + chrome | 9 | 6 | 2 | Mobile LH + CR |
| H3 | Pin `backend-service` version + E2E per pool | 10 | 6 | 2 | Cloud reliability |
| H4 | Account deletion request API + Account UI | 8 | 6 | 4 | GDPR/CPRA |
| H5 | AI route rate limits parity with presign | 8 | 5 | 2 | Abuse resistance |
| H6 | Strip framer-motion from tool hot paths | 8 | 5 | 2 | Mobile perf |
| H7 | R2 direct download signed URLs (bypass Vercel body) | 7 | 6 | 3 | Scale + cost |
| H8 | Presign magic-byte validation | 7 | 5 | 2 | Security |

---

## 17. Long-Term Roadmap (3–12 months)

| # | Initiative | Impact | Difficulty | Risk |
|---|------------|--------|------------|------|
| L1 | Single `ToolWorkspace` abstraction | 10 | 9 | 5 |
| L2 | SOC2-friendly logging + DPA pack for enterprise | 9 | 9 | 3 |
| L3 | Team workspaces + SSO (SAML) | 9 | 10 | 4 |
| L4 | Monorepo workers or contract-tested `backend-service` | 10 | 8 | 4 |
| L5 | Edge PDF preview tiles (WASM) desktop only | 6 | 7 | 2 |
| L6 | Public API + webhooks for B2B | 8 | 9 | 5 |
| L7 | Automated trust copy + SEO alignment in CI (`qa:trust-copy` gate) | 7 | 3 | 1 |

---

## Appendix A — Automated checks run

```bash
npm run audit-routes      # OK
npm run qa:trust-copy     # High: 0, Medium: 19
npm run typecheck         # Pass (local)
```

## Appendix B — Related reports

| Document | Use |
|----------|-----|
| `docs/WORLD_CLASS_AUDIT_2026.md` | Backend, workers, LH scores |
| `docs/TOOL_PAGE_MIGRATION_REPORT_2026.md` | Tool UX tiers |
| `docs/COMPLIANCE_AUDIT_2026.md` | Regulation mapping |
| `docs/TRUST_LEGAL_SAFETY_AUDIT_2026.md` | Marketing/legal copy |
| `reports/tool-matrix.json` | 38 routes HTTP 200 |
| `reports/infra-audit.json` | Env checklist |
| `reports/remaining-risks.md` | Ops checklist |

---

*This audit is descriptive, not a warranty of production behavior. Re-validate after each major deploy.*

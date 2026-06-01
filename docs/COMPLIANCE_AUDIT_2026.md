# PDFTrusted Compliance & Privacy Transparency Audit (2026)

**Audit date:** 2026-05-28  
**Method:** Codebase scan of legal pages, consent, analytics, ads, processing flows, retention, and account systems.  
**Rule:** No framework marked “fully compliant” without verified implementation. No invented certifications or country lists.

---

## Phase 1 — Compliance inventory (verified)

| Area | Status | Evidence |
|------|--------|----------|
| Privacy Policy page | Implemented | `src/route-pages/PrivacyPolicy.tsx`, route `/privacy-policy` |
| Cookie Policy page | Implemented | `src/route-pages/CookiePolicy.tsx`, route `/cookie-policy` |
| Terms of Service | Implemented | `src/route-pages/TermsOfService.tsx` |
| Disclaimer | Implemented | `src/route-pages/Disclaimer.tsx` |
| Refund Policy | Implemented | `src/route-pages/RefundPolicy.tsx` |
| Security page | Implemented | `src/route-pages/Security.tsx` |
| Privacy Center | Implemented | `src/route-pages/PrivacyCenter.tsx` — retention section, pillars |
| Consent storage | Implemented | `src/lib/consent.ts` — categories: essential, analytics, advertising, preferences |
| Cookie banner UI | Implemented | `src/components/consent/CookieConsentBanner.tsx` — accept / reject / customize |
| Cookie banner visibility | **Conditional** | Shown when `isAdsenseEnabled()` **or** GA measurement ID env is set (`CookieConsentBanner.tsx`) |
| AdSense | **Disabled in code** | `isAdsenseEnabled()` returns `false` in `src/lib/adsense.ts`; ad components no-op |
| `ads.txt` | Present | `public/ads.txt` (publisher verification template) |
| Analytics (GA4) | **Optional + gated (after fix)** | `VITE_GA_MEASUREMENT_ID` in `src/utils/logger.ts`; loads only if `hasAnalyticsConsent()` |
| Error monitoring | Implemented | Sentry in `src/utils/logger.ts`, `sentry.shared.ts`, `sendDefaultPii: false`, scrubbing |
| Browser processing | Implemented | Client-side tools via WASM/JS; described in Privacy Center |
| Cloud processing | Implemented | Enhanced jobs API, R2 staging, Railway AI worker, callbacks |
| Cloud retention / purge | Implemented | Cron `src/app/api/cron/r2-staging-purge/route.ts`, job lifecycle |
| Footer legal links | Partial | Privacy, Terms, Cookie + cookie settings (`Footer.tsx`); Disclaimer/Refund not in main footer columns |
| Account auth | Implemented | Supabase/session routes under `src/app/api/auth`, account pages |
| Account deletion (self-service) | **Not found** | No delete-account API/UI in codebase scan |
| Data export (portability) | **Not found** | No automated export UI |
| CCPA heuristic notice | Implemented | `isLikelyCcpaRegion()` in `src/lib/consent.ts`, shown in banner when active |
| AI processing disclosure | Partial | Privacy Center, tool copy; not all tools link to AI data flow |
| OCR / vision flows | Implemented | Server AI modules `server/ai/*`, enhanced jobs |
| Help Center legal content | Implemented | Help hub, guides, FAQ routes |

---

## Phase 2 & 3 — Regulation mapping (summary)

Legend: **Full** = core requirements verifiably addressed · **Partial** = some controls, gaps remain · **Unknown** = cannot verify from code alone · **Not** = not implemented

| Framework | Rating | Notes & evidence |
|-----------|--------|------------------|
| GDPR (EU) | Partial | Policies + consent framework + retention narrative; no verified DPA registry, DSR automation, or EU representative in code |
| UK GDPR | Partial | Same as GDPR; no UK-specific addenda verified |
| PECR / UK ePrivacy | Partial | Cookie banner when monetization/analytics active; advertising off |
| ePrivacy (EEA) | Partial | Consent before non-essential cookies when banner active |
| CCPA / CPRA (California) | Partial | Heuristic notice + reject non-essential; no verified “Do Not Sell/Share” link, opt-out signal handling, or metrics disclosure |
| VCDPA (Virginia) | Partial | Generic privacy docs; no state-specific rights portal |
| CPA (Colorado) | Partial | Same |
| CTDPA (Connecticut) | Partial | Same |
| UCPA (Utah) | Partial | Same |
| APP (Australia) | Partial | Privacy policy; no OAIC-specific mechanisms verified |
| NZ Privacy Act | Partial | Policy-level only |
| PIPEDA (Canada) | Partial | Policy + consent; no verified breach notification process in product |
| LGPD (Brazil) | Partial | Policy; no DPO contact or legal basis matrix in code |
| Swiss FADP | Unknown | No Switzerland-specific implementation found |
| Singapore PDPA | Unknown | No SG-specific controls |
| South Korea PIPA | Unknown | No KR-specific controls |
| Japan APPI | Unknown | No JP-specific controls |
| UAE PDPL | Unknown | No UAE-specific controls |
| Saudi PDPL | Unknown | No KSA-specific controls |
| India DPDPA | Unknown | No India-specific consent/rights UI |
| South Africa POPIA | Unknown | No POPIA-specific controls |

**Verified country/region coverage (product reach only, not legal compliance):** Global web app with localized routes and blog; infrastructure references US/EU/Middle East/India/SEA in marketing copy — **not** a legal “supported countries” list.

---

## Phase 4 — About page section

Added: `src/components/about/AboutComplianceSection.tsx`, wired in `AboutUs.tsx`. Wording is defensible and avoids certification claims.

---

## Phase 5 — Trust & transparency scorecard

| Capability | Supported? |
|------------|------------|
| Privacy policy & cookie policy | Yes |
| Terms, disclaimer, refund | Yes (pages exist) |
| Granular cookie consent UI | Yes (when banner active) |
| Reject non-essential cookies | Yes |
| Reopen cookie preferences | Yes (footer + About section) |
| Analytics gated by consent | Yes (after 2026-05-28 fix) |
| Advertising consent | Yes (storage); ads disabled in code |
| Cloud file auto-cleanup | Yes (cron/purge) |
| Browser-local processing option | Yes |
| Security / Privacy Center pages | Yes |
| Self-service account deletion | No |
| Automated data export | No |
| Verified regulatory certification | No |

---

## Phase 6 — Gap analysis (ranked)

### Critical
1. **No self-service account deletion** — GDPR/CPRA/LGPD erasure rights may require manual process; disclose SLA in privacy policy and implement API + UI.
2. **Cookie banner inactive when GA env unset and ads off** — Users get no first-party consent prompt unless analytics ID configured; document or enable banner for essential transparency.

### High
3. **No automated data subject request workflow** — Access/portability/deletion rely on contact form.
4. **Marketing previously claimed “GDPR, CCPA compliant”** — Softened in `HomeGlobalTrust.tsx`; audit other locales/strings.
5. **Footer omits disclaimer/refund** — Reduces discoverability.

### Medium
6. **GA events** — Ensure all `gtag` / conversion events respect `hasAnalyticsConsent()` (load gated; verify event helpers).
7. **State privacy law links** — No US state-specific privacy notices (CPRA, VCDPA, etc.).
8. **International transfer disclosures** — Policy text should name subprocessors (Supabase, Cloudflare R2, Railway, Vercel, OpenRouter, etc.) if not already in Privacy Policy body.

### Low
9. **Privacy Center i18n keys** — `retentionTitle` / `retentionBody` use defaults in `PrivacyCenter.tsx`.
10. **PECR cookie categorization** — Document essential vs non-essential cookies in Cookie Policy table.

---

## Phase 7 — Recommended improvements

1. Ship **account deletion** and **data export** endpoints + Account page controls.
2. Show cookie banner when **any** non-essential tracking may load (GA, Sentry replay in prod, etc.), with category labels.
3. Add **Privacy Rights** hub: access, delete, opt-out of sale/share (even if “we do not sell”), limit use of sensitive data.
4. Maintain **subprocessor list** in Privacy Policy with last-updated date.
5. Run **legal review** of policy text against target markets before any “compliance” marketing.
6. Log consent version + timestamp server-side for signed-in users (optional audit trail).

---

## Code changes from this audit pass

- Mobile tool chrome header on tool routes (`App.tsx`)
- Mobile preview policy enforced (`previewPolicy.ts`, `ToolFilePreviewPane`, `ToolResultPanel`, `SmartScanAi`, `ChatPdfWorkspace`)
- `ToolHelpLinks` hidden on mobile
- `AboutComplianceSection` + softened `HomeGlobalTrust` compliance pillar
- GA load gated by `hasAnalyticsConsent()`
- Cookie banner activates when GA env is configured

---

*This document is an engineering audit, not legal advice.*

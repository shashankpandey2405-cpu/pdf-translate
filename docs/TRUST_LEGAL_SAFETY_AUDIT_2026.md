# PDFTrusted — Global Trust, Legal Safety & Brand Credibility Audit

**Date:** 2026-05-28  
**Purpose:** Kal ko legal / reputational problem na ho — sab public claims inventory + safe guidance.  
**Method:** Full scan of About, legal pages, Help/Learn/FAQ, Footer, Home, tools, blog, SEO bundles, JSON-LD, trust UI.  
**Not legal advice** — engineering + content risk review.

---

## Executive summary (Hindi + English)

**Kya safe hai (KEEP):**
- Privacy Policy, Terms, Cookie Policy, Disclaimer, Refund, Security, Privacy Center — **exist** and mostly conservative
- Hybrid processing honesty in `trustCopy.ts`, `SiteTrustBanner`, Security page
- Cookie consent code (`consent.ts`) + banner (when GA/ads env on)
- About **Compliance section** (factual, no “certified globally”)
- Terms: “AS IS”, no warranty for legal/medical use — **good**

**Kya risky tha (REWRITE — done 2026-05-28):**
- “World’s most secure”, “files never leave device” jab cloud AI hai
- Blog: “GDPR/CCPA compliant”, “full compliance with US law”
- Pricing: “PCI-DSS Compliant” (PayPal checkout ≠ aap PCI certified)
- “50,000+ professionals”, “99.9% OCR”, “near-100% accuracy”
- Founder story: “No cloud, no catch”

**Abhi bhi improve karna (backlog):**
- Other locales (`de.json`, `hi.json`, …) — kuch strings ab bhi “never leave device”
- Tool SEO: “100% in browser” tools jahan cloud bhi hai — tool-by-tool review
- Self-service account deletion — policies ke liye important
- Blog competitor stats (pricing, feature counts) — verify ya soften

---

## 1. Trust audit (verified strengths)

| Signal | Evidence | Safe to claim? |
|--------|----------|----------------|
| HTTPS site | Privacy/Security copy, TLS | Yes |
| Browser-first tools | Code + `trustCopy.ts` | Yes, with “when supported” |
| Optional cloud | Enhanced jobs, presign, purge cron | Yes, if labeled |
| Privacy Policy | `/privacy-policy` | Yes |
| Cookie controls | `CookieConsentBanner`, footer link | Yes (when banner active) |
| PayPal billing | Terms + checkout routes | Yes — “via PayPal” |
| Help / Guides / FAQ | `/help`, `/guides`, `/faq` | Yes |
| Independent project | Founder copy, no corp entity in code | Yes |
| Sentry with scrubbing | `sentry.shared.ts` | Yes internally |
| No AdSense runtime | `isAdsenseEnabled() === false` | Yes |

---

## 2. Risk audit (high → low)

### Critical (fix before marketing push)
| Risk | Where | Issue |
|------|-------|-------|
| Absolute privacy | About founder (was), blog | “Never upload / never leave device” while cloud exists |
| Legal compliance claims | Blog (was) | “Complies with GDPR/CCPA/UAE law” without certification |
| PCI wording | Pricing (fixed) | Implied own PCI certification |

### High
| Risk | Where | Issue |
|------|-------|-------|
| Unverifiable social proof | Pricing (fixed) | “50,000+ users” |
| Accuracy guarantees | Pricing SEO (partial fix) | “99.9%”, “near-100%” |
| Military / zero-knowledge | About story (fixed) | Overstates crypto guarantees |
| No account deletion | Product gap | GDPR/CPRA erasure expectations |

### Medium
| Risk | Where | Issue |
|------|-------|-------|
| Competitive superiority | `toolSeoBundles.ts`, blog | “No other tool”, “most advanced” |
| ISO/government PDF/A copy | PDF/A SEO | OK if tool outputs PDF/A; avoid “all agencies require” absolutes |
| Cookie banner off | No GA env | Users see no consent UI |
| i18n drift | `de.json` etc. | English fixes not synced |

### Low
| Risk | Where | Issue |
|------|-------|-------|
| “100% transparency” founder | Founder trust line | Hyperbole, not legal |
| Government resume templates | Product naming | OK if template style only |

---

## 3. Claim inventory (by category)

### Privacy & processing
| Claim | Location | Verdict | Notes |
|-------|----------|---------|-------|
| Browser-first / hybrid | Home, trust banner, security | **Keep** | Accurate core message |
| Files never leave device | Blog/tools (many) | **Rewrite** | Only for browser-only tools |
| Encrypted cloud + auto-delete | Privacy, cloud labels | **Keep** | Match retention cron |
| No training on uploads | Terms, privacy | **Keep** | Verify AI vendor contracts operationally |
| Zero-knowledge protocol | About founder steps (en) | **Improve** | Too strong; prefer “no persistent library” |

### Legal / compliance
| Claim | Location | Verdict |
|-------|----------|---------|
| GDPR/CCPA compliant | Blog (was) | **Remove** → design-aligned language |
| GDPR-aware UK meta | Blog (fixed) | **Improve** → privacy-conscious |
| About compliance section | About | **Keep** |
| CCPA notice in banner | consent | **Keep** (heuristic) |

### Security
| Claim | Location | Verdict |
|-------|----------|---------|
| HTTPS | Security page | **Keep** |
| Military-grade encryption | About/pricing (fixed) | **Rewrite** → TLS/HTTPS |
| PCI-DSS compliant checkout | Pricing (fixed) | **Rewrite** → PayPal secure checkout |

### Performance / AI
| Claim | Location | Verdict |
|-------|----------|---------|
| Up to 90% compression | About, blog | **Keep** with disclaimer * |
| 99.9% OCR / near-100% scan | Pricing, Smart Scan SEO (fixed) | **Rewrite** |
| Fastest / best / #1 | SEO/blog | **Remove** or soften |

### Company
| Claim | Location | Verdict |
|-------|----------|---------|
| Solo / independent developer | Founder | **Keep** — verified positioning |
| Large corporation implied | Avoid | **Keep** honest indie framing |
| 50k+ professionals | Pricing (fixed) | **Remove** |

### Billing
| Claim | Location | Verdict |
|-------|----------|---------|
| 14-day money back | Pricing (fixed) | **Keep** tied to Refund Policy |
| PayPal checkout | Terms | **Keep** |

---

## 4. Page-by-page classification

### About (`AboutUs.tsx`, `en.json`, `AboutComplianceSection`)
| Statement | Action |
|-----------|--------|
| Mission / pillars / founder | **Rewrite** (done) — hybrid truth |
| Compliance section | **Keep** |
| 90% compression | **Keep** + disclaimer |
| “Industry-leading performance” | **Improve** → “engineered for performance” (optional) |

### Privacy / Terms / Cookie / Security
| Statement | Action |
|-----------|--------|
| Privacy policy body | **Keep** — largely defensible |
| Terms AS IS / liability cap | **Keep** |
| Cookie policy | **Keep** |
| Security page | **Keep** |

### Homepage
| Statement | Action |
|-----------|--------|
| `HomeGlobalTrust` pillar | **Keep** (fixed earlier) |
| `HomePowerFeatures` CDN worldwide | **Improve** — avoid latency guarantees |
| `trustCopy.ts` hero | **Keep** |

### Blog (`posts.ts`)
| Statement | Action |
|-----------|--------|
| GDPR/CCPA/UAE compliance | **Rewrite** (done) |
| Never leave device | **Rewrite** (done) |
| Competitor comparisons | **Improve** — cite sources or soften |

### Tool SEO (`toolSeoBundles.ts`)
| Statement | Action |
|-----------|--------|
| Smart Scan superlatives | **Rewrite** (done) |
| “100% browser” per tool | **Review** each slug vs actual path |
| PDF/A government required | **Improve** — “many agencies” not “all” |

### Pricing
| Statement | Action |
|-----------|--------|
| PCI / 50k / military / 99.9% | **Rewrite** (done) |
| Adobe price compare | **Keep** if prices verified periodically |

### Footer
| Statement | Action |
|-----------|--------|
| Privacy strip | **Keep** |
| Missing disclaimer/refund links | **Improve** — add links |

---

## 5. Safe trust messaging (use everywhere)

**Tagline (safe):**  
“Browser-first PDF tools with optional encrypted cloud for AI and heavy jobs.”

**Privacy (safe):**  
“We design PDFTrusted with privacy, transparency, and user control in mind. Many tools run in your browser; cloud jobs use HTTPS, short retention, and no sale of your documents for ads.”

**Compliance (safe):**  
“Our policies and consent tools reflect widely recognized privacy principles. We do not claim regulator certification—see Privacy Policy and Privacy Center.”

**Company (safe):**  
“PDFTrusted is an independent software project built for global users.”

---

## 6. Enterprise-friendly About (recommended tone)

- Lead with **independent platform**, not enterprise corporation
- Explain **two processing paths** with diagram/link to Security
- Link **Privacy Center**, **Security**, **Terms**, **contact for DSR**
- List **subprocessors** in Privacy Policy (Cloudflare, PayPal, Supabase if used, AI providers)
- State **no SOC 2 / ISO 27001 certificate** unless you obtain one

---

## 7. Google trust improvements (no ranking tricks)

1. Accurate `Organization` / `WebSite` JSON-LD — no false `aggregateRating`
2. Help Center depth — already good; keep factual
3. Consistent hybrid message in meta descriptions
4. Blog YMYL: remove legal compliance assertions
5. `sameAs` only for real social profiles

---

## 8. Legal risk reduction — priority list

1. ✅ Rewrite absolute privacy + compliance marketing (2026-05-28)
2. ✅ Sync **locale safeA** (ar, de, es, fr, hi, zh) — 2026-05-28
3. ✅ Privacy Center **rights & requests** + 30-day SLA wording — 2026-05-28
4. ✅ Footer links: Disclaimer, Refund, Security — 2026-05-28
5. ✅ `npm run qa:trust-copy` — browser vs cloud SEO mismatches — 2026-05-28
6. ✅ Subprocessor + rights sections in Privacy Policy — 2026-05-28
7. ⬜ Legal review before any “compliance” badge on homepage
8. ⬜ Self-service account deletion (in-app)

---

## 9. Files changed in safety pass (2026-05-28)

- `src/locales/en.json` — About, founder, pricing, story
- `src/data/blog/posts.ts` — privacy/compliance paragraphs
- `src/data/seo/toolSeoBundles.ts` — Smart Scan claims
- `src/components/about/FounderStorySections.tsx` — promise fallback
- `src/components/pricing/PricingPlans.tsx` — trust badge defaults

**Related:** `docs/COMPLIANCE_AUDIT_2026.md` (regulatory mapping), `src/components/about/AboutComplianceSection.tsx`

---

*Review quarterly or before major marketing campaigns.*

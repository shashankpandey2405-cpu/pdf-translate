# Google Search Console Submission Checklist

## Pre-submission verification

### Critical files
- [x] **Sitemap**: `/public/sitemap.xml` → `https://www.pdftrusted.com/sitemap.xml`
- [x] **Robots.txt**: `/public/robots.txt` → `https://pdftrusted.com/robots.txt`
- [x] **Manifest**: `/public/manifest.webmanifest`

### Sitemap (auto-generated on `npm run build`)
```
Format: XML with xhtml namespace for hreflang
Locales: en, hi, zh, ar, es, fr, de (7 languages)
URLs: ~443 total (385 canonical locale routes + 58 native SEO alias slugs)
Update: Every production build (scripts/generate-sitemap.mjs)
```

### Locale SEO aliases (beyond Gemini-style “same slug everywhere”)
Native keyword URLs stay in the address bar; middleware rewrites to canonical tool routes. Examples:
- `https://pdftrusted.com/es/comprimir-pdf`
- `https://pdftrusted.com/de/pdf-komprimieren`
- `https://pdftrusted.com/fr/fusionner-pdf`

### Structured data
- Organization + WebSite (+ SearchAction) site-wide
- SoftwareApplication + BreadcrumbList on tool pages
- FAQ / ItemList on compare hub and knowledge hubs

### Meta
- [x] Canonical per locale (uses public alias path when applicable)
- [x] hreflang alternates in sitemap
- [x] No fake aggregateRating in JSON-LD

## Submit to Google Search Console

1. Property: `https://pdftrusted.com/`
2. **Sitemaps** → submit `https://www.pdftrusted.com/sitemap.xml`
3. Also submit in **Bing Webmaster Tools** (same sitemap URL)
4. After deploy, inspect sample URLs:
   - `https://pdftrusted.com/en/compress-pdf`
   - `https://pdftrusted.com/es/comprimir-pdf` (alias)
   - `https://pdftrusted.com/hi/pdf-merge`
   - `https://pdftrusted.com/compare/sejda`
5. **Coverage**: expect hundreds of URLs; alias + canonical pairs are intentional

## Post-submit monitoring (7–14 days)

- [ ] Sitemap status: Success
- [ ] Indexed URL count trending up (not instant)
- [ ] Hreflang: no “return tags” errors
- [ ] Core Web Vitals: mobile + desktop
- [ ] Compare + tool rich results (FAQ where eligible)

## Code vs marketing (global rank)

**Already in codebase:** i18n SEO, native slugs, sitemap, schema, compare pages (iLovePDF, Smallpdf, Sejda, PDF24, Acrobat), hero-keyword extra FAQs (`src/data/seo/heroKeywordSeo.ts`), browser-first home copy, honest browser/cloud tiers on compress & convert tools, limits table on tool pages (`ToolLimitsPanel`).

**30-day plan:** see `docs/SEO_30_DAY_CALENDAR.md`.

**Still manual (not code):** quality backlinks, brand searches, GSC/Bing submission, India-first short video, Reddit/Quora (non-spam).

## Regenerate sitemap locally

```bash
npm run build
```

---

**Last updated**: May 20, 2026  
**Build verified**: `npm run build` — sitemap 443 URLs  
**Next action**: Deploy → submit sitemap in GSC + Bing

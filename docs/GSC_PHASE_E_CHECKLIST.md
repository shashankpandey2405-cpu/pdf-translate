# Phase E — GSC, Lighthouse & Community (Manual)

Complete these steps after deploying the Google Comparison Report upgrade.

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console) for `https://www.pdftrusted.com/`
2. **Sitemaps** → submit `https://www.pdftrusted.com/sitemap.xml`
3. **URL inspection** (request indexing after deploy):
   - `/en/` (home)
   - `/en/merge-pdf`
   - `/en/compress-pdf`
   - `/en/compare/speed`
   - `/en/chat-pdf`
   - `/en/ai-summarize`
4. **Core Web Vitals** → filter Mobile → fix URLs in "Poor" or "Needs improvement"

## Lighthouse mobile (targets)

Run in Chrome DevTools → Lighthouse → Mobile:

| Page | LCP | CLS | INP |
|------|-----|-----|-----|
| Home `/en/` | &lt; 2.5s | &lt; 0.1 | &lt; 200ms |
| `/en/merge-pdf` | &lt; 2.5s | &lt; 0.1 | &lt; 200ms |

Common fixes already in codebase: lazy tool chunks, PWA shell, hero background `ssr: false`, safe-area padding.

## Community (5 genuine answers/week)

- **Reddit:** r/pdf, r/productivity — answer with specific steps, link only when relevant
- **Quora:** "best free PDF merge", "OCR PDF online" — cite Private Local vs Turbo Cloud honestly
- **Do not:** mass copy-paste links, parasite SEO, trend hijacking

## AdSense resubmit (after content)

Ensure these pages have visible unique copy (500+ words article footer):

- `/en/ai-summarize` ✓
- `/en/chat-pdf` ✓
- `/en/translate-pdf` ✓
- `/en/ocr-pdf` ✓
- Home `#why-pdftrusted` section ✓

Then request review in AdSense when 5+ tool pages meet E-E-A-T bar.

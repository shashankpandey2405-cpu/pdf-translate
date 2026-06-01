#!/usr/bin/env node
/**
 * Generates sitemap-index.xml + per-category sitemap XML files.
 * Outputs to public/ folder. Run: node scripts/generate-sitemap.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { HELP_GUIDE_SLUGS, LEARN_SITEMAP_PATHS } from "../constants/helpSitemapSlugs.js";

const SITE = "https://www.pdftrusted.com";
const LOCALES = ["en", "hi", "zh", "ar", "es", "fr", "de"];
const REGION_TARGETS = ["en-US", "en-IN", "en-PK", "en-AE", "en-SG"];
const DEFAULT_LOCALE = "en";
const TODAY = new Date().toISOString().slice(0, 10);
const OUT = join(import.meta.dirname, "..", "public");

// ── Page definitions with SEO priority ──────────────────────────

const HOMEPAGE = [{ path: "/", priority: 1.0, changefreq: "daily" }];

const TOOL_PAGES = [
  // Core tools — highest traffic
  { path: "/merge-pdf", priority: 0.95, changefreq: "weekly" },
  { path: "/compress-pdf", priority: 0.95, changefreq: "weekly" },
  { path: "/split-pdf", priority: 0.90, changefreq: "weekly" },
  { path: "/pdf-editor", priority: 0.95, changefreq: "weekly" },
  { path: "/pdf-to-word", priority: 0.92, changefreq: "weekly" },
  { path: "/word-to-pdf", priority: 0.90, changefreq: "weekly" },
  { path: "/sign-pdf", priority: 0.90, changefreq: "weekly" },
  { path: "/pdf-to-image", priority: 0.85, changefreq: "weekly" },
  { path: "/pdf-to-png", priority: 0.82, changefreq: "weekly" },
  { path: "/pdf-to-jpg", priority: 0.82, changefreq: "weekly" },
  { path: "/unlock-pdf", priority: 0.85, changefreq: "weekly" },
  { path: "/protect-pdf", priority: 0.85, changefreq: "weekly" },
  { path: "/rotate-pdf", priority: 0.80, changefreq: "weekly" },
  { path: "/watermark-pdf", priority: 0.80, changefreq: "weekly" },
  { path: "/page-numbers", priority: 0.78, changefreq: "weekly" },
  { path: "/extract-pages", priority: 0.78, changefreq: "weekly" },
  { path: "/remove-pages", priority: 0.78, changefreq: "weekly" },
  { path: "/organize-pdf", priority: 0.78, changefreq: "weekly" },
  { path: "/repair-pdf", priority: 0.80, changefreq: "weekly" },
  { path: "/redact-pdf", priority: 0.82, changefreq: "weekly" },
  { path: "/ocr-pdf", priority: 0.85, changefreq: "weekly" },
  { path: "/hard-lock-pdf", priority: 0.80, changefreq: "weekly" },
  { path: "/pdf-to-html", priority: 0.75, changefreq: "weekly" },
  { path: "/flatten-pdf", priority: 0.80, changefreq: "weekly" },
  { path: "/compare-pdf", priority: 0.80, changefreq: "weekly" },
  { path: "/pdf-to-pdfa", priority: 0.82, changefreq: "weekly" },
  { path: "/generate-qr-code", priority: 0.72, changefreq: "weekly" },
  { path: "/pdf-to-pptx", priority: 0.78, changefreq: "weekly" },
  { path: "/pdf-to-excel", priority: 0.78, changefreq: "weekly" },
  { path: "/excel-to-pdf", priority: 0.75, changefreq: "weekly" },
  { path: "/pptx-to-pdf", priority: 0.75, changefreq: "weekly" },
  { path: "/pdf-to-epub", priority: 0.72, changefreq: "weekly" },
  { path: "/jpg-to-pdf", priority: 0.75, changefreq: "weekly" },
  { path: "/png-to-pdf", priority: 0.75, changefreq: "weekly" },
];

const AI_TOOL_PAGES = [
  { path: "/tools/ai-scanner", priority: 0.88, changefreq: "weekly" },
  { path: "/translate-pdf", priority: 0.88, changefreq: "weekly" },
  { path: "/ai-summarize", priority: 0.88, changefreq: "weekly" },
  { path: "/chat-pdf", priority: 0.88, changefreq: "weekly" },
  { path: "/smart-scan-ai", priority: 0.90, changefreq: "weekly" },
  { path: "/ai-document-scanner", priority: 0.90, changefreq: "weekly" },
  { path: "/photo-to-editable-pdf", priority: 0.92, changefreq: "weekly" },
  { path: "/scan-to-editable-pdf", priority: 0.88, changefreq: "weekly" },
  { path: "/image-to-editable-pdf", priority: 0.86, changefreq: "weekly" },
  { path: "/ai-question-gen", priority: 0.85, changefreq: "weekly" },
  { path: "/remove-watermark", priority: 0.82, changefreq: "weekly" },
];

const PRODUCT_PAGES = [
  { path: "/all-tools", priority: 0.85, changefreq: "weekly" },
  { path: "/converter", priority: 0.80, changefreq: "weekly" },
  { path: "/universal-converter", priority: 0.78, changefreq: "weekly" },
  { path: "/pdf-maker", priority: 0.80, changefreq: "weekly" },
  { path: "/document-scanner", priority: 0.78, changefreq: "weekly" },
  { path: "/photo-resizer", priority: 0.72, changefreq: "weekly" },
  { path: "/resume-builder", priority: 0.78, changefreq: "weekly" },
  { path: "/download", priority: 0.70, changefreq: "monthly" },
  { path: "/get-app", priority: 0.70, changefreq: "monthly" },
  { path: "/pricing", priority: 0.85, changefreq: "weekly" },
];

const COMPARE_PAGES = [
  { path: "/compare", priority: 0.75, changefreq: "monthly" },
  { path: "/compare/speed", priority: 0.76, changefreq: "monthly" },
  { path: "/compare/ilovepdf", priority: 0.78, changefreq: "monthly" },
  { path: "/compare/smallpdf", priority: 0.78, changefreq: "monthly" },
  { path: "/compare/adobe-acrobat", priority: 0.78, changefreq: "monthly" },
  { path: "/compare/sejda", priority: 0.75, changefreq: "monthly" },
  { path: "/compare/pdf24", priority: 0.75, changefreq: "monthly" },
];

const BLOG_PAGES = [
  { path: "/blog", priority: 0.80, changefreq: "weekly" },
  { path: "/blog/best-ai-pdf-tools-2026", priority: 0.75, changefreq: "monthly" },
  { path: "/blog/compress-pdf-90-percent", priority: 0.75, changefreq: "monthly" },
  { path: "/blog/chat-with-pdf-ai", priority: 0.75, changefreq: "monthly" },
  { path: "/blog/ai-pdf-tools-vs-smallpdf-ilovepdf", priority: 0.75, changefreq: "monthly" },
  { path: "/blog/best-ai-pdf-tools-usa", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/fastest-pdf-compressor-usa", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/best-pdf-tools-uae", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/ai-pdf-compression-dubai", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/best-ai-pdf-tools-india-students", priority: 0.74, changefreq: "monthly" },
  { path: "/blog/compress-pdf-india-government-forms", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/best-pdf-tools-uk-professionals", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/pdf-tools-canada-small-business", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/ai-pdf-tools-australia-remote-teams", priority: 0.72, changefreq: "monthly" },
  { path: "/blog/pdf-compression-singapore-business", priority: 0.72, changefreq: "monthly" },
];

const INFO_PAGES = [
  { path: "/about-us", priority: 0.72, changefreq: "weekly" },
  { path: "/contact", priority: 0.55, changefreq: "monthly" },
  { path: "/faq", priority: 0.65, changefreq: "monthly" },
  { path: "/how-to-use", priority: 0.60, changefreq: "monthly" },
  { path: "/help", priority: 0.72, changefreq: "weekly" },
  { path: "/guides", priority: 0.70, changefreq: "weekly" },
  { path: "/learn", priority: 0.68, changefreq: "weekly" },
  { path: "/security", priority: 0.60, changefreq: "monthly" },
  { path: "/privacy-center", priority: 0.50, changefreq: "monthly" },
  { path: "/privacy-policy", priority: 0.40, changefreq: "yearly" },
  { path: "/terms-of-service", priority: 0.40, changefreq: "yearly" },
  { path: "/refund-policy", priority: 0.40, changefreq: "yearly" },
  { path: "/cookie-policy", priority: 0.35, changefreq: "yearly" },
  { path: "/disclaimer", priority: 0.35, changefreq: "yearly" },
];

const HELP_HUB_PAGES = [
  { path: "/help/getting-started", priority: 0.68, changefreq: "monthly" },
  { path: "/help/troubleshooting", priority: 0.65, changefreq: "monthly" },
  { path: "/help/billing", priority: 0.65, changefreq: "monthly" },
  { path: "/help/privacy", priority: 0.65, changefreq: "monthly" },
  ...HELP_GUIDE_SLUGS.flatMap((slug) => [
    { path: `/guides/${slug}`, priority: 0.75, changefreq: "monthly" },
    { path: `/faq/${slug}`, priority: 0.72, changefreq: "monthly" },
  ]),
  ...LEARN_SITEMAP_PATHS.map((path) => ({
    path,
    priority: 0.70,
    changefreq: "monthly",
  })),
];

// ── XML helpers ─────────────────────────────────────────────────

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHreflangs(path) {
  const suffix = path === "/" ? "" : path;
  return LOCALES.map(
    (loc) =>
      `    <xhtml:link rel="alternate" hreflang="${loc}" href="${SITE}/${loc}${suffix}" />`
  )
    .concat(
      REGION_TARGETS.map(
        (region) =>
          `    <xhtml:link rel="alternate" hreflang="${region}" href="${SITE}/en${suffix}" />`
      )
    )
    .concat(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${DEFAULT_LOCALE}${suffix}" />`
    )
    .join("\n");
}

function buildUrlEntry({ path, priority, changefreq }, locale) {
  const loc = `${SITE}/${locale}${path === "/" ? "" : path}`;
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${buildHreflangs(path)}
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
  </url>`;
}

function buildHreflangsEnglishOnly(path) {
  const suffix = path === "/" ? "" : path;
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/en${suffix}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/en${suffix}" />`,
  ].join("\n");
}

function buildUrlEntryBlog({ path, priority, changefreq }) {
  const loc = `${SITE}/en${path === "/" ? "" : path}`;
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${buildHreflangsEnglishOnly(path)}
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
  </url>`;
}

function buildSitemapBlogOnly(pages) {
  const entries = pages.map((page) => buildUrlEntryBlog(page));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;
}

function buildSitemap(pages) {
  const entries = [];
  for (const page of pages) {
    for (const locale of LOCALES) {
      entries.push(buildUrlEntry(page, locale));
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;
}

function buildSitemapIndex(filenames) {
  const entries = filenames
    .map(
      (f) => `  <sitemap>
    <loc>${SITE}/${f}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

// ── Generate ────────────────────────────────────────────────────

const sitemaps = [
  { filename: "sitemap-home.xml", pages: HOMEPAGE },
  { filename: "sitemap-tools.xml", pages: TOOL_PAGES },
  { filename: "sitemap-ai-tools.xml", pages: AI_TOOL_PAGES },
  { filename: "sitemap-products.xml", pages: PRODUCT_PAGES },
  { filename: "sitemap-compare.xml", pages: COMPARE_PAGES },
  { filename: "sitemap-blog.xml", pages: BLOG_PAGES },
  { filename: "sitemap-info.xml", pages: INFO_PAGES },
  { filename: "sitemap-help.xml", pages: HELP_HUB_PAGES },
];

let totalUrls = 0;
for (const { filename, pages } of sitemaps) {
  const isBlog = filename === "sitemap-blog.xml";
  const xml = isBlog ? buildSitemapBlogOnly(pages) : buildSitemap(pages);
  const urlCount = isBlog ? pages.length : pages.length * LOCALES.length;
  totalUrls += urlCount;
  writeFileSync(join(OUT, filename), xml, "utf-8");
  console.log(
    `  ✓ ${filename} — ${urlCount} URLs (${pages.length} pages${isBlog ? ", en only" : ` × ${LOCALES.length} locales`})`,
  );
}

const indexXml = buildSitemapIndex(sitemaps.map((s) => s.filename));
writeFileSync(join(OUT, "sitemap.xml"), indexXml, "utf-8");
console.log(`\n  ✓ sitemap.xml (index) — ${sitemaps.length} sub-sitemaps`);
console.log(`  Total: ${totalUrls} URLs across ${LOCALES.length} locales`);
console.log("  Done!");

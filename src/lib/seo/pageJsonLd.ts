import { getLocalizedHomeSeo, getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { LOCALE_ALL_TOOLS_SEO } from "@/data/seo/localeToolSeo/allTools";
import {
  buildFaqPageLd,
  buildHowToLd,
  buildSoftwareApplicationLd,
  buildWebPageLd,
  jsonLdScript,
} from "@/lib/seo/buildToolJsonLd";
import { buildHomePageLd } from "@/lib/seo/globalJsonLd";
import { getLocalizedCompareHub } from "@/lib/seo/localizedCompareSeo";
import { buildToolJsonLdStrings } from "@/lib/seo/toolJsonLd";
import { BRAND_NAME, SITE_URL, type LocaleCode } from "@/lib/seo/site";
import { getPublicSeoPathSuffix } from "@/lib/seo/seoPath";

type ToolListEntry = { slug: string; path: string; name: string; description: string };

/** Live tools for ItemList — import from shared catalog at build time via slug list. */
const CATALOG_TOOL_PATHS: Array<{ slug: string; path: string }> = [
  { slug: "merge-pdf", path: "/merge-pdf" },
  { slug: "compress-pdf", path: "/compress-pdf" },
  { slug: "split-pdf", path: "/split-pdf" },
  { slug: "extract-pages", path: "/extract-pages" },
  { slug: "remove-pages", path: "/remove-pages" },
  { slug: "organize-pdf", path: "/organize-pdf" },
  { slug: "pdf-to-word", path: "/pdf-to-word" },
  { slug: "word-to-pdf", path: "/word-to-pdf" },
  { slug: "pdf-editor", path: "/pdf-editor" },
  { slug: "sign-pdf", path: "/sign-pdf" },
  { slug: "ocr-pdf", path: "/ocr-pdf" },
  { slug: "protect-pdf", path: "/protect-pdf" },
  { slug: "unlock-pdf", path: "/unlock-pdf" },
  { slug: "pdf-to-image", path: "/pdf-to-image" },
  { slug: "watermark-pdf", path: "/watermark-pdf" },
  { slug: "rotate-pdf", path: "/rotate-pdf" },
  { slug: "page-numbers", path: "/page-numbers" },
  { slug: "pptx-to-pdf", path: "/pptx-to-pdf" },
  { slug: "pdf-to-excel", path: "/pdf-to-excel" },
  { slug: "excel-to-pdf", path: "/excel-to-pdf" },
  { slug: "jpg-to-pdf", path: "/jpg-to-pdf" },
  { slug: "png-to-pdf", path: "/png-to-pdf" },
  { slug: "document-scanner", path: "/document-scanner" },
  { slug: "tools/ai-scanner", path: "/tools/ai-scanner" },
  { slug: "generate-qr-code", path: "/generate-qr-code" },
  { slug: "compare", path: "/compare" },
];

function toolEntries(locale: LocaleCode): ToolListEntry[] {
  return CATALOG_TOOL_PATHS.map(({ slug, path }) => {
    const bundle = getLocalizedToolSeoBundle(locale, slug);
    const name =
      bundle?.title.split("|")[0]?.trim() ??
      slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const description = bundle?.description ?? `${name} — ${BRAND_NAME}`;
    return { slug, path, name, description };
  });
}

function buildItemListLd(locale: LocaleCode, pageUrl: string, items: ToolListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: LOCALE_ALL_TOOLS_SEO[locale]?.title ?? "PDF Tools",
    description: LOCALE_ALL_TOOLS_SEO[locale]?.description,
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      description: item.description,
      url: `${SITE_URL}/${locale}${item.path}`,
    })),
  };
}

function buildAllToolsLd(locale: LocaleCode, pathSuffix: string) {
  const meta = LOCALE_ALL_TOOLS_SEO[locale] ?? LOCALE_ALL_TOOLS_SEO.en;
  const pageUrl = `${SITE_URL}/${locale}${pathSuffix}`;
  const items = toolEntries(locale);
  return [
    jsonLdScript(
      buildWebPageLd({
        name: meta.title,
        description: meta.description,
        url: pageUrl,
        lang: locale,
      }),
    ),
    jsonLdScript(buildItemListLd(locale, pageUrl, items)),
  ];
}

function buildCompareHubLd(locale: LocaleCode, pathSuffix: string) {
  const hub = getLocalizedCompareHub(locale);
  const pageUrl = `${SITE_URL}/${locale}${pathSuffix}`;
  const parts = [
    jsonLdScript(
      buildWebPageLd({
        name: hub.metaTitle,
        description: hub.metaDescription,
        url: pageUrl,
        lang: locale,
      }),
    ),
  ];
  const faq = buildFaqPageLd(hub.faqs);
  if (faq) parts.push(jsonLdScript(faq));
  return parts;
}

/**
 * SSR JSON-LD for any public route. Uses public URL path (SEO alias) when set via middleware.
 */
export function buildPageJsonLdStrings(
  locale: LocaleCode,
  pathSegments: string[] | undefined,
  publicPathSuffix?: string | null,
): string[] {
  const slug = pathSegments?.join("/") ?? "";
  const pathSuffix =
    publicPathSuffix ?? (slug ? `/${slug}` : "");

  if (!slug) {
    const homeFaqs = [
      { question: "What is AI PDF compression?", answer: "PdfTrusted uses smart compression algorithms that analyze each page's content to reduce file size up to 90% without visible quality loss." },
      { question: "How accurate is OCR on PdfTrusted?", answer: "Our AI-powered OCR achieves near-perfect accuracy on printed text in 50+ languages, including complex scripts like Arabic, Hindi, and Chinese." },
      { question: "Can I chat with my PDF documents?", answer: "Yes. Upload any PDF and ask questions in natural language. Our AI reads and understands the entire document, providing accurate answers and key point extraction." },
      { question: "Is PdfTrusted free to use?", answer: "Core tools like merge, compress, split, convert, and sign are completely free with no account required. AI-powered features offer free usage for small files." },
      { question: "What regions does PdfTrusted serve?", answer: "PdfTrusted is a global platform accessible from any country with optimized infrastructure for the US, India, UAE, UK, Canada, Australia, Singapore, Europe, and Southeast Asia." },
      { question: "How does PdfTrusted protect my documents?", answer: "Browser-first tools process files entirely on your device. For cloud AI features, files are encrypted in transit and at rest, automatically deleted after processing, and never used for training." },
    ];
    const faqLd = buildFaqPageLd(homeFaqs);
    const scripts = [jsonLdScript(buildHomePageLd(locale))];
    if (faqLd) scripts.push(jsonLdScript(faqLd));
    return scripts;
  }

  if (slug === "all-tools") {
    return buildAllToolsLd(locale, pathSuffix);
  }

  if (slug === "compare") {
    return buildCompareHubLd(locale, pathSuffix);
  }

  const toolLd = buildToolJsonLdStrings(locale, slug, pathSuffix);
  if (toolLd.length) return toolLd;

  return [];
}

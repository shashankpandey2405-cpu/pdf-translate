"use client";

import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { BRAND_LOGO_URL } from "@/lib/branding";
import { BRAND_NAME, SITE_URL, SUPPORTED_LOCALES, REGION_HREFLANG_TARGETS } from "@/lib/seo/site";
import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { formatToolSeoTitle, SEO_TITLE_TRUST } from "@/lib/seo/formatToolTitle";
import { buildFaqPageLd, buildHowToLd, buildWebPageLd } from "@/lib/seo/buildToolJsonLd";

interface ToolSEOProps {
  title: string;
  description: string;
  /** URL path segment(s) without locale, e.g. merge-pdf or tools/ai-scanner */
  slug: string;
  lang?: string;
  keywords?: string;
  noIndex?: boolean;
}

const SUPPORTED = [...SUPPORTED_LOCALES];

function documentTitle(pageTitle: string, isHome: boolean): string {
  if (isHome) {
    return /\|\s*PDFTrusted\s*$/i.test(pageTitle) ? pageTitle : `${pageTitle} | ${BRAND_NAME}`;
  }
  if (/\|\s*PDFTrusted\s*$/i.test(pageTitle)) return pageTitle;
  if (new RegExp(SEO_TITLE_TRUST, "i").test(pageTitle)) return pageTitle;
  return `${pageTitle} | ${SEO_TITLE_TRUST} | ${BRAND_NAME}`;
}

export default function ToolSEO({
  title,
  description,
  slug,
  lang = "en",
  keywords: keywordsProp,
  noIndex = false,
}: ToolSEOProps) {
  const { t } = useTranslation();
  const normalizedSlug = slug === "" || slug === "/" ? "" : `/${slug.replace(/^\/+/, "")}`;
  const canonicalPath = `/${lang}${normalizedSlug}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImage = BRAND_LOGO_URL;

  const bundleKey = slug.replace(/^\/+/, "") || "";
  const bundle = bundleKey ? getLocalizedToolSeoBundle(lang, bundleKey) : undefined;
  const i18nTitle =
    bundleKey.length > 0
      ? t(`seo.tools.${bundleKey}.title`, { defaultValue: bundle?.title ?? title })
      : title;
  const i18nDescription =
    bundleKey.length > 0
      ? t(`seo.tools.${bundleKey}.description`, { defaultValue: bundle?.description ?? description })
      : description;
  const i18nKeywords =
    bundleKey.length > 0
      ? t(`seo.tools.${bundleKey}.keywords`, { defaultValue: bundle?.keywords ?? keywordsProp ?? "" })
      : keywordsProp ?? "";

  const isHome = bundleKey === "";

  const pageTitle = isHome ? title : formatToolSeoTitle(i18nTitle, bundle?.title);
  const rawDescription = bundleKey ? i18nDescription : description;
  const trustSnippet = "Free, no-login, secure.";
  const pageDescription =
    /free/i.test(rawDescription) && /no[- ]?login/i.test(rawDescription) && /secure/i.test(rawDescription)
      ? rawDescription
      : `${rawDescription.trim().replace(/\.\s*$/, "")}. ${trustSnippet}`;
  const keywords =
    (typeof i18nKeywords === "string" && i18nKeywords.trim().length > 0 ? i18nKeywords : undefined) ??
    bundle?.keywords ??
    keywordsProp;

  const fullTitle = documentTitle(pageTitle, isHome);

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: fullTitle,
    url: canonicalUrl,
    description: pageDescription,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    author: { "@type": "Organization", name: "pdftrusted.com", url: SITE_URL },
    publisher: { "@type": "Organization", name: "pdftrusted.com", url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList:
      bundle?.howToSteps?.map((step) => step.name) ||
      ["PDF Processing", "Secure Browser Technology", "Free Online Tools"],
  };

  const webPage = buildWebPageLd({
    name: fullTitle,
    description: pageDescription,
    url: canonicalUrl,
    lang,
  });

  const faqLd = bundle ? buildFaqPageLd(bundle.faqs) : null;
  const howToLd = bundle ? buildHowToLd(bundle) : null;

  const breadcrumbSchema = isHome
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: pageTitle, item: canonicalUrl },
        ],
      };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={pageDescription} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />
      {SUPPORTED.map((locale) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={`${SITE_URL}/${locale}${normalizedSlug}`} />
      ))}
      {REGION_HREFLANG_TARGETS.map((region) => (
        <link key={region} rel="alternate" hrefLang={region} href={`${SITE_URL}/en${normalizedSlug}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en${normalizedSlug}`} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${BRAND_NAME} logo`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={ogImage} />
      {!isHome ? <script type="application/ld+json">{JSON.stringify(softwareApp)}</script> : null}
      <script type="application/ld+json">{JSON.stringify(webPage)}</script>
      {faqLd ? <script type="application/ld+json">{JSON.stringify(faqLd)}</script> : null}
      {howToLd ? <script type="application/ld+json">{JSON.stringify(howToLd)}</script> : null}
      {breadcrumbSchema ? (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      ) : null}
    </Helmet>
  );
}

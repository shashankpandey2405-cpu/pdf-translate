"use client";

import { Helmet } from "react-helmet-async";
import { BRAND_LOGO_URL } from "@/lib/branding";
import { BRAND_NAME, SITE_URL, SUPPORTED_LOCALES } from "@/lib/seo/site";
import type { ToolFaq } from "@/data/seo/toolSeoBundles";

type Props = {
  title: string;
  description: string;
  /** Path after locale, e.g. compare/ilovepdf */
  slug: string;
  lang?: string;
  keywords?: string;
  faqs: ToolFaq[];
  competitorName?: string;
};

const SUPPORTED = [...SUPPORTED_LOCALES];

export function CompareSEO({ title, description, slug, lang = "en", keywords, faqs, competitorName }: Props) {
  const normalizedSlug = slug.replace(/^\/+/, "");
  const canonicalPath = `/${lang}/${normalizedSlug}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImage = BRAND_LOGO_URL;
  const pageTitle = title.replace(/\s*\|\s*PDFTrusted\s*$/i, "").trim();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${pageTitle} | ${BRAND_NAME}`,
    description,
    url: canonicalUrl,
    inLanguage: lang,
    isPartOf: { "@type": "WebSite", name: BRAND_NAME, url: SITE_URL },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/${lang}/compare` },
      { "@type": "ListItem", position: 3, name: pageTitle, item: canonicalUrl },
    ],
  };

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  };

  const comparisonSchema = competitorName
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${pageTitle} | ${BRAND_NAME}`,
        description,
        url: canonicalUrl,
        about: [
          { "@type": "SoftwareApplication", name: BRAND_NAME, url: SITE_URL },
          { "@type": "SoftwareApplication", name: competitorName },
        ],
      }
    : null;

  return (
    <Helmet>
      <title>{`${pageTitle} | ${BRAND_NAME}`}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />
      {SUPPORTED.map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={`${SITE_URL}/${locale}/${normalizedSlug}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en/${normalizedSlug}`} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={`${pageTitle} | ${BRAND_NAME}`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${pageTitle} | ${BRAND_NAME}`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <script type="application/ld+json">{JSON.stringify(webPage)}</script>
      <script type="application/ld+json">{JSON.stringify(softwareApp)}</script>
      {comparisonSchema ? (
        <script type="application/ld+json">{JSON.stringify(comparisonSchema)}</script>
      ) : null}
      {faqs.length > 0 ? (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      ) : null}
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
    </Helmet>
  );
}

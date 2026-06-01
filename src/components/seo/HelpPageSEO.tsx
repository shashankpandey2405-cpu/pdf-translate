"use client";

import { Helmet } from "react-helmet-async";
import { BRAND_NAME, SITE_URL, SUPPORTED_LOCALES } from "@/lib/seo/site";
import { buildFaqPageLd, buildHowToLd, buildWebPageLd } from "@/lib/seo/buildToolJsonLd";
import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

type Props = {
  title: string;
  description: string;
  path: string;
  lang?: string;
  bundle?: ToolRichSeo;
  schemaType?: "guide" | "faq" | "article";
};

export function HelpPageSEO({
  title,
  description,
  path,
  lang = "en",
  bundle,
  schemaType = "article",
}: Props) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}/${lang}${normalizedPath}`;
  const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;

  const webPage = buildWebPageLd({
    name: fullTitle,
    description,
    url: canonicalUrl,
    lang,
  });

  const faqLd = schemaType === "faq" && bundle ? buildFaqPageLd(bundle.faqs) : null;
  const howToLd = schemaType === "guide" && bundle ? buildHowToLd(bundle) : null;

  const articleLd =
    schemaType === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: fullTitle,
          description,
          url: canonicalUrl,
          inLanguage: lang,
          publisher: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
        }
      : null;

  const graph = [webPage, faqLd, howToLd, articleLd].filter(Boolean);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {SUPPORTED_LOCALES.map((loc) => (
        <link key={loc} rel="alternate" hrefLang={loc} href={`${SITE_URL}/${loc}${normalizedPath}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en${normalizedPath}`} />
      {graph.length > 0 ? (
        <script type="application/ld+json">{JSON.stringify(graph.length === 1 ? graph[0] : graph)}</script>
      ) : null}
    </Helmet>
  );
}

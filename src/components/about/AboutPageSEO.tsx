"use client";

import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { BRAND_LOGO_URL } from "@/lib/branding";
import { SITE_URL, SUPPORTED_LOCALES } from "@/lib/seo/site";

export function AboutPageSEO() {
  const { t, i18n } = useTranslation();
  const [pathname] = useLocation();
  const suffix = pathname === "/" ? "" : pathname;
  const canonicalUrl = `${SITE_URL}/${i18n.language}${suffix}`;

  const title = t("aboutPage.seo.title", {
    defaultValue: "Founder's Mission | The Tech Behind PDFTrusted",
  });
  const description = t("aboutPage.seo.description", {
    defaultValue:
      "Discover how PDFTrusted is redefining document intelligence. Learn about our browser-native AI, ultra-compression technology, and our mission for a private web.",
  });
  const keywords = t("aboutPage.seo.keywords", {
    defaultValue:
      "AI PDF architect, browser-native PDF processing, private PDF compression technology, PDFTrusted founder",
  });

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t("aboutPage.founder.name", { defaultValue: "PDFTrusted Founder" }),
    jobTitle: t("aboutPage.founder.title", { defaultValue: "Founder & Lead Architect" }),
    url: `${SITE_URL}/${i18n.language}/about-us`,
    worksFor: {
      "@type": "Organization",
      name: "PDFTrusted",
      url: SITE_URL,
    },
    knowsAbout: [
      "Browser-native PDF processing",
      "Neural-Native AI",
      "WebAssembly document optimization",
      "Privacy-first document intelligence",
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: i18n.language,
    author: personSchema,
    isPartOf: { "@type": "WebSite", name: "PDFTrusted", url: SITE_URL },
  };

  return (
    <Helmet>
      <title>{`${title} | PDFTrusted`}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />
      {SUPPORTED_LOCALES.map((loc) => (
        <link key={loc} rel="alternate" hrefLang={loc} href={`${SITE_URL}/${loc}${suffix}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en${suffix}`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={`${title} | PDFTrusted`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={BRAND_LOGO_URL} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | PDFTrusted`} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">{JSON.stringify(personSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
    </Helmet>
  );
}

import { BRAND_LOGO_URL } from "@/lib/branding";
import { BRAND_NAME, SITE_URL, type LocaleCode } from "@/lib/seo/site";
import { getLocalizedHomeSeo } from "@/lib/seo/localizedToolSeo";
import { jsonLdScript, type JsonLdGraph } from "@/lib/seo/buildToolJsonLd";

export function buildOrganizationLd(): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
    logo: BRAND_LOGO_URL,
    sameAs: [],
    description:
      "AI-powered document intelligence platform: compress, translate, OCR, summarize, and chat with PDFs. Used globally across the US, India, UAE, UK, Canada, Australia, and Singapore.",
    areaServed: "Worldwide",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/en/contact`,
      availableLanguage: ["English", "Hindi", "Spanish", "French", "German", "Arabic", "Chinese"],
    },
  };
}

export function buildWebSiteLd(locale: LocaleCode = "en"): JsonLdGraph {
  const home = getLocalizedHomeSeo(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: `${SITE_URL}/${locale}`,
    description: home.description,
    inLanguage: locale,
    publisher: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/all-tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebApplicationLd(): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND_NAME,
    url: SITE_URL,
    description:
      "AI-powered PDF intelligence platform with 30+ tools: compression, OCR, translation, summarization, document chat, and conversion.",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "AI Document Intelligence",
    operatingSystem: "All",
    browserRequirements: "Requires a modern web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Free tier with core tools; premium plans for AI-powered features",
    },
    featureList: [
      "PDF Compression up to 90%",
      "AI-Powered OCR",
      "PDF Translation in 50+ Languages",
      "AI Document Summarization",
      "Chat with PDF",
      "PDF Merge and Split",
      "PDF to Word Conversion",
      "Digital Signatures",
      "PDF Editor",
      "Smart Scan AI",
    ],
    author: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
  };
}

export function buildSoftwareApplicationLd(): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${BRAND_NAME} — AI Document Intelligence Platform`,
    url: SITE_URL,
    description:
      "Advanced AI document intelligence platform for PDF processing: compression, OCR, translation, summarization, and conversational AI.",
    applicationCategory: "Productivity",
    applicationSubCategory: "Document Management",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
  };
}

export function buildHomePageLd(locale: LocaleCode): JsonLdGraph {
  const home = getLocalizedHomeSeo(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: home.title,
    description: home.description,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", name: BRAND_NAME, url: SITE_URL },
    about: {
      "@type": "SoftwareApplication",
      name: BRAND_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  };
}

export function buildGlobalJsonLdScripts(locale: LocaleCode = "en"): string[] {
  return [
    jsonLdScript(buildOrganizationLd()),
    jsonLdScript(buildWebSiteLd(locale)),
    jsonLdScript(buildWebApplicationLd()),
    jsonLdScript(buildSoftwareApplicationLd()),
  ];
}

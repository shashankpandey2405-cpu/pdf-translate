import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";
import { BRAND_NAME, SITE_URL } from "@/lib/seo/site";

export type JsonLdGraph = Record<string, unknown>;

export function buildFaqPageLd(faqs: ToolRichSeo["faqs"]): JsonLdGraph | null {
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function buildHowToLd(bundle: ToolRichSeo): JsonLdGraph | null {
  if (!bundle.howToSteps?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: bundle.title,
    description: bundle.description,
    totalTime: "PT2M",
    step: bundle.howToSteps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function buildWebPageLd(params: {
  name: string;
  description: string;
  url: string;
  lang: string;
}): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: params.name,
    description: params.description,
    url: params.url,
    inLanguage: params.lang,
    isPartOf: { "@type": "WebSite", name: BRAND_NAME, url: SITE_URL },
  };
}

export function buildSoftwareApplicationLd(params: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  featureList?: string[];
}): JsonLdGraph {
  const ld: JsonLdGraph = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: params.name,
    description: params.description,
    url: params.url,
    applicationCategory: params.applicationCategory ?? "BusinessApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    provider: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
  };
  if (params.featureList?.length) {
    ld.featureList = params.featureList;
  }
  return ld;
}

export function jsonLdScript(ld: JsonLdGraph): string {
  return JSON.stringify(ld);
}

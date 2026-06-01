import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import {
  buildFaqPageLd,
  buildHowToLd,
  buildSoftwareApplicationLd,
  buildWebPageLd,
  jsonLdScript,
} from "@/lib/seo/buildToolJsonLd";
import { SITE_URL } from "@/lib/seo/site";

/** Server-rendered FAQPage + HowTo + WebPage JSON-LD for crawlers. */
export function buildToolJsonLdStrings(
  locale: string,
  slug: string,
  publicPathSuffix?: string,
): string[] {
  const bundle = getLocalizedToolSeoBundle(locale, slug);
  if (!bundle) return [];

  const parts: string[] = [];
  const faq = buildFaqPageLd(bundle.faqs);
  const howTo = buildHowToLd(bundle);
  if (faq) parts.push(jsonLdScript(faq));
  if (howTo) parts.push(jsonLdScript(howTo));

  const pathPart =
    publicPathSuffix?.replace(/^\/+/, "") ?? slug.replace(/^\/+/, "");
  const url = `${SITE_URL}/${locale}/${pathPart}`;
  parts.push(
    jsonLdScript(
      buildWebPageLd({
        name: bundle.title,
        description: bundle.description,
        url,
        lang: locale,
      }),
    ),
  );
  const featureList = bundle.keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 8);

  parts.push(
    jsonLdScript(
      buildSoftwareApplicationLd({
        name: bundle.title.split("|")[0]?.trim() ?? bundle.title,
        description: bundle.description,
        url,
        featureList,
      }),
    ),
  );

  parts.push(
    jsonLdScript({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: bundle.title.split("|")[0]?.trim() ?? slug,
          item: url,
        },
      ],
    }),
  );

  return parts;
}

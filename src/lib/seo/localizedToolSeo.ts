import type { LocaleCode } from "@/lib/seo/site";
import { isLocaleCode } from "@/lib/seo/site";
import { LOCALE_HOME_SEO, LOCALE_TOOL_SEO } from "@/data/seo/localeToolSeo";
import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";
import { getToolSeoBundle } from "@/data/seo/toolSeoBundles";
import { mergeHeroKeywordSeo } from "@/data/seo/heroKeywordSeo";

const LOCALE_SEO_ALIASES: Record<string, string> = {
  "pdf-to-png": "pdf-to-image",
  "pdf-to-jpg": "pdf-to-image",
  "magic-eraser": "remove-watermark",
};

export function getLocalizedToolSeoBundle(locale: string, slug: string): ToolRichSeo | undefined {
  const raw = slug.replace(/^\/+/, "");
  const key = LOCALE_SEO_ALIASES[raw] ?? raw;
  const base = getToolSeoBundle(key);
  if (!base) return undefined;

  const loc: LocaleCode = isLocaleCode(locale) ? locale : "en";
  const override = LOCALE_TOOL_SEO[loc]?.[key] ?? LOCALE_TOOL_SEO[loc]?.[raw];
  const merged: ToolRichSeo = !override
    ? base
    : {
        title: override.title ?? base.title,
        description: override.description ?? base.description,
        keywords: override.keywords ?? base.keywords,
        bodyParagraphs:
          override.bodyParagraphs && override.bodyParagraphs.length > 0
            ? override.bodyParagraphs
            : base.bodyParagraphs,
        howToSteps:
          override.howToSteps && override.howToSteps.length > 0 ? override.howToSteps : base.howToSteps,
        faqs: override.faqs && override.faqs.length > 0 ? override.faqs : base.faqs,
      };

  const hero = mergeHeroKeywordSeo(loc, key, merged.faqs, merged.description);
  return {
    ...merged,
    description: hero.metaDescription ?? merged.description,
    faqs: hero.faqs.length ? hero.faqs : merged.faqs,
  };
}

export function getLocalizedHomeSeo(locale: string): { title: string; description: string } {
  const loc: LocaleCode = isLocaleCode(locale) ? locale : "en";
  return LOCALE_HOME_SEO[loc] ?? LOCALE_HOME_SEO.en;
}

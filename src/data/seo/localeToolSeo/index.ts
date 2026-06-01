import type { LocaleCode } from "@/lib/seo/site";
import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";
import { LOCALE_HOME_SEO } from "@/data/seo/localeToolSeo/home";
import { HI_TOOL_SEO } from "@/data/seo/localeToolSeo/hi";
import { HI_TOOL_SEO_PHASE2 } from "@/data/seo/localeToolSeo/hi-phase2";
import { ES_TOOL_SEO } from "@/data/seo/localeToolSeo/es";
import { ES_TOOL_SEO_PHASE2 } from "@/data/seo/localeToolSeo/es-phase2";
import { META_ONLY_LOCALES } from "@/data/seo/localeToolSeo/metaOnly";
import { META_PHASE2_LOCALES } from "@/data/seo/localeToolSeo/meta-phase2";
import { ZH_TOOL_SEO_PHASE3 } from "@/data/seo/localeToolSeo/zh-phase3";
import { AR_TOOL_SEO_PHASE3 } from "@/data/seo/localeToolSeo/ar-phase3";
import { FR_TOOL_SEO_PHASE3 } from "@/data/seo/localeToolSeo/fr-phase3";
import { DE_TOOL_SEO_PHASE3 } from "@/data/seo/localeToolSeo/de-phase3";

export { LOCALE_HOME_SEO };

function mergeToolSeo(
  ...parts: Array<Record<string, Partial<ToolRichSeo>>>
): Record<string, Partial<ToolRichSeo>> {
  return Object.assign({}, ...parts);
}

function mergeMetaLocales(
  base: Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>>,
  phase2: Record<string, Record<string, Partial<ToolRichSeo>>>,
  phase3: Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>>,
): Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>> {
  const out: Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>> = { ...base };
  for (const loc of Object.keys(phase2)) {
    const code = loc as LocaleCode;
    out[code] = mergeToolSeo(out[code] ?? {}, phase2[loc] ?? {}, phase3[code] ?? {});
  }
  for (const loc of Object.keys(phase3)) {
    const code = loc as LocaleCode;
    if (!out[code]) out[code] = mergeToolSeo(phase3[code] ?? {});
  }
  return out;
}

const META_BODY_PHASE3: Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>> = {
  zh: ZH_TOOL_SEO_PHASE3,
  ar: AR_TOOL_SEO_PHASE3,
  fr: FR_TOOL_SEO_PHASE3,
  de: DE_TOOL_SEO_PHASE3,
};

export const LOCALE_TOOL_SEO: Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>> = {
  hi: mergeToolSeo(HI_TOOL_SEO, HI_TOOL_SEO_PHASE2),
  es: mergeToolSeo(ES_TOOL_SEO, ES_TOOL_SEO_PHASE2),
  ...mergeMetaLocales(META_ONLY_LOCALES, META_PHASE2_LOCALES, META_BODY_PHASE3),
};

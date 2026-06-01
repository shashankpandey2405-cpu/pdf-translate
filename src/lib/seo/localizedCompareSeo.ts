import type { CompareCompetitor } from "@/data/seo/comparePages";
import { COMPARE_COMPETITORS, COMPARE_HUB } from "@/data/seo/comparePages";
import { LOCALE_COMPARE } from "@/data/seo/localeCompare";
import type { LocaleCode } from "@/lib/seo/site";
import { isLocaleCode } from "@/lib/seo/site";

export type CompareHubCopy = Pick<
  typeof COMPARE_HUB,
  "metaTitle" | "metaDescription" | "keywords" | "intro" | "faqs"
>;

function mergeCompare<T extends Record<string, unknown>>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

export function getLocalizedCompareHub(locale: string): CompareHubCopy {
  const loc: LocaleCode = isLocaleCode(locale) ? locale : "en";
  const o = LOCALE_COMPARE[loc]?.hub;
  return mergeCompare(COMPARE_HUB, o);
}

export function getLocalizedCompareCompetitor(
  locale: string,
  slug: string,
): CompareCompetitor | undefined {
  const base = COMPARE_COMPETITORS[slug];
  if (!base) return undefined;
  const loc: LocaleCode = isLocaleCode(locale) ? locale : "en";
  const o = LOCALE_COMPARE[loc]?.competitors?.[slug];
  return mergeCompare(base, o) as CompareCompetitor;
}

export function getLocalizedCompareMeta(
  locale: string,
  pathSegments: string[],
): { title: string; description: string; keywords?: string } | undefined {
  const first = pathSegments[0];
  if (first !== "compare") return undefined;

  if (pathSegments.length === 1) {
    const hub = getLocalizedCompareHub(locale);
    return {
      title: hub.metaTitle,
      description: hub.metaDescription,
      keywords: hub.keywords,
    };
  }

  if (pathSegments.length >= 2) {
    const c = getLocalizedCompareCompetitor(locale, pathSegments[1]!);
    if (!c) return undefined;
    return {
      title: c.metaTitle,
      description: c.metaDescription,
      keywords: c.keywords,
    };
  }

  return undefined;
}

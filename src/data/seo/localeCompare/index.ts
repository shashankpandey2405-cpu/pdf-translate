import type { LocaleCode } from "@/lib/seo/site";
import type { CompareCompetitor } from "@/data/seo/comparePages";
import type { CompareHubCopy } from "@/lib/seo/localizedCompareSeo";
import { ZH_COMPARE } from "@/data/seo/localeCompare/zh";
import { AR_COMPARE } from "@/data/seo/localeCompare/ar";
import { FR_COMPARE } from "@/data/seo/localeCompare/fr";
import { DE_COMPARE } from "@/data/seo/localeCompare/de";

export type LocaleCompareBundle = {
  hub?: Partial<CompareHubCopy>;
  competitors?: Record<string, Partial<CompareCompetitor>>;
};

export const LOCALE_COMPARE: Partial<Record<LocaleCode, LocaleCompareBundle>> = {
  zh: ZH_COMPARE,
  ar: AR_COMPARE,
  fr: FR_COMPARE,
  de: DE_COMPARE,
};

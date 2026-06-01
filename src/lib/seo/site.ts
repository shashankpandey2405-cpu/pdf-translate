/** Canonical site identity for JSON-LD, canonical URLs, and Open Graph. */
export const SITE_URL = "https://www.pdftrusted.com";
export const BRAND_NAME = "PDFTrusted";
export const SUPPORTED_LOCALES = ["en", "hi", "zh", "ar", "es", "fr", "de"] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: LocaleCode = "en";

/**
 * Region-specific hreflang targets for geo-targeting.
 * All point to the /en/ variant but signal to Google that the English content
 * is relevant for these specific regions.
 */
export const REGION_HREFLANG_TARGETS = [
  "en-US",
  "en-IN",
  "en-PK",
  "en-AE",
  "en-SG",
] as const;

export function isLocaleCode(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

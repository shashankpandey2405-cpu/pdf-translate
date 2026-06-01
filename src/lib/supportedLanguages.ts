/** Locale codes shared by routing, SEO, and i18n — no i18next side effects. */
export const SUPPORTED_LANGUAGES = ["en", "hi", "zh", "ar", "es", "fr", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

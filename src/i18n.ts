import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/supportedLanguages";

export { SUPPORTED_LANGUAGES, type SupportedLanguage };

const LOCALE_LOADERS: Record<
  SupportedLanguage,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => Promise.resolve({ default: en }),
  hi: () => import("@/locales/hi.json"),
  ar: () => import("@/locales/ar.json"),
  zh: () => import("@/locales/zh.json"),
  es: () => import("@/locales/es.json"),
  fr: () => import("@/locales/fr.json"),
  de: () => import("@/locales/de.json"),
};

const loadedLocales = new Set<SupportedLanguage>(["en"]);

/** Load a locale bundle on demand (keeps ~200 KiB of JSON out of the home JS path). */
export async function ensureI18nLanguage(lng: SupportedLanguage): Promise<void> {
  if (loadedLocales.has(lng)) return;
  const mod = await LOCALE_LOADERS[lng]();
  i18n.addResourceBundle(lng, "translation", mod.default, true, true);
  loadedLocales.add(lng);
}

export async function changeAppLanguage(lng: SupportedLanguage): Promise<void> {
  await ensureI18nLanguage(lng);
  await i18n.changeLanguage(lng);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    returnNull: false,
    interpolation: { escapeValue: false },
  });
}

export default i18n;

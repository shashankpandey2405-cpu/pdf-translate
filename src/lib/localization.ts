import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/supportedLanguages";

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const PREFERRED_LANGUAGE_STORAGE_KEY = "pt_preferred_language";

export function isSupportedLanguage(value?: string | null): value is SupportedLanguage {
  return !!value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const raw = navigator.language?.toLowerCase() || DEFAULT_LANGUAGE;
  const short = raw.split("-")[0];
  return isSupportedLanguage(short) ? short : DEFAULT_LANGUAGE;
}

export function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(PREFERRED_LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredLanguage(language: SupportedLanguage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFERRED_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // noop
  }
}

export async function detectGeoLanguage(): Promise<SupportedLanguage | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/locale-hint", { method: "GET" });
    if (!response.ok) return null;
    const data = await response.json() as { suggestedLanguage?: string };
    return isSupportedLanguage(data?.suggestedLanguage) ? data.suggestedLanguage : null;
  } catch {
    return null;
  }
}

export function getPathLanguage(pathname: string): SupportedLanguage | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isSupportedLanguage(firstSegment) ? firstSegment : null;
}

export function stripLangFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (isSupportedLanguage(segments[0])) {
    return `/${segments.slice(1).join("/")}` || "/";
  }
  return pathname || "/";
}

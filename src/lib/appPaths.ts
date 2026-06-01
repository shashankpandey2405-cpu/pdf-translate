import { DEFAULT_LANGUAGE, getPathLanguage, isSupportedLanguage } from "@/lib/localization";
import type { SupportedLanguage } from "@/lib/supportedLanguages";

/** Normalize an in-app path (always leading slash, no locale prefix). */
export function appPath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Full pathname for `window.location` / canonical URLs: `/{locale}/tool`.
 * Strips a duplicate locale segment if already present.
 */
export function localePath(path: string, locale: SupportedLanguage = DEFAULT_LANGUAGE): string {
  const normalized = appPath(path);
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] && isSupportedLanguage(segments[0])) {
    return normalized;
  }
  return `/${locale}${normalized}`;
}

/** Universal converter shortcut (wouter-safe — router base adds locale). */
export function universalConverterPath(from: string, to: string): string {
  return appPath(`/universal-converter?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

/**
 * Collapse `/en/en/foo` → `/en/foo` for middleware redirects.
 */
export function collapseDuplicateLocalePath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  if (!isSupportedLanguage(segments[0]!) || segments[0] !== segments[1]) return null;
  const rest = segments.slice(2).join("/");
  return rest ? `/${segments[0]}/${rest}` : `/${segments[0]}`;
}

export function localeFromWindow(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  return getPathLanguage(window.location.pathname) || DEFAULT_LANGUAGE;
}

/** Strip ?query and #hash for Wouter route matching. */
export function pathWithoutSearchHash(path: string): string {
  const q = path.indexOf("?");
  const h = path.indexOf("#");
  const end = q === -1 ? (h === -1 ? path.length : h) : q;
  const base = path.slice(0, end) || "/";
  return base.startsWith("/") ? base : `/${base}`;
}

/** In-app login path (relative to Wouter `/{locale}` base). */
export function loginAppPath(
  locale: SupportedLanguage = DEFAULT_LANGUAGE,
  nextPath: string = `/${locale}/all-tools`,
): string {
  const next = encodeURIComponent(localePath(nextPath, locale));
  return `/login?next=${next}`;
}

/** Full URL path for SSR `<a href>` (includes locale segment). */
export function loginLocaleHref(
  locale: SupportedLanguage = DEFAULT_LANGUAGE,
  nextPath: string = `/${locale}/all-tools`,
): string {
  return `${localePath("/login", locale)}?next=${encodeURIComponent(localePath(nextPath, locale))}`;
}

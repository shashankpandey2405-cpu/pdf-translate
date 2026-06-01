import { headers } from "next/headers";
import { resolveCanonicalToolPath } from "@/lib/seo/localeSlugAliases";
import type { LocaleCode } from "@/lib/seo/site";

export const SEO_PUBLIC_PATH_HEADER = "x-seo-public-path";

/** Path after locale from middleware (alias URL) or from route segments. */
export async function getPublicSeoPathSuffix(
  locale: LocaleCode,
  routeSegments: string[] | undefined,
): Promise<string> {
  const h = await headers();
  const fromHeader = h.get(SEO_PUBLIC_PATH_HEADER);
  if (fromHeader) {
    const normalized = fromHeader.startsWith("/") ? fromHeader : `/${fromHeader}`;
    const withoutLocale = normalized.replace(new RegExp(`^/${locale}`), "") || "/";
    return withoutLocale === "/" ? "" : withoutLocale;
  }
  const slug = routeSegments?.join("/") ?? "";
  return slug ? `/${slug}` : "";
}

/** Canonical tool slug/path for data lookup (alias → merge-pdf, etc.). */
export function getCanonicalSlugFromRoute(
  locale: LocaleCode,
  routeSegments: string[] | undefined,
): string {
  const slug = routeSegments?.join("/") ?? "";
  if (!slug) return "";
  const canonical = resolveCanonicalToolPath(locale, slug);
  return canonical ?? slug;
}

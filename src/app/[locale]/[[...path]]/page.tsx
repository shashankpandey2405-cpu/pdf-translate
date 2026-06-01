import type { Metadata } from "next";
import { StaticHomeMasterHero } from "@/components/home/StaticHomeMasterHero";
import NextAppShell from "@/components/NextAppShell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildGlobalJsonLdScripts } from "@/lib/seo/globalJsonLd";
import { buildPageJsonLdStrings } from "@/lib/seo/pageJsonLd";
import { getPublicSeoPathSuffix } from "@/lib/seo/seoPath";
import {
  DEFAULT_LOCALE,
  isLocaleCode,
  type LocaleCode,
} from "@/lib/seo/site";

function wouterPathFromParams(path: string[] | undefined): string {
  if (!path?.length) return "/";
  return `/${path.join("/")}`;
}

function searchFromParams(searchParams: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; path?: string[] }>;
}): Promise<Metadata> {
  const { locale, path } = await params;
  const initialLocale: LocaleCode = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  return buildPageMetadata(initialLocale, path);
}

export default async function PdfTrustedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, path } = await params;
  const resolvedSearch = await searchParams;
  const initialLocale: LocaleCode = isLocaleCode(locale) ? locale : DEFAULT_LOCALE;
  const ssrSearch = searchFromParams(resolvedSearch ?? {});
  const publicPathSuffix = await getPublicSeoPathSuffix(initialLocale, path);
  const ssrPath = publicPathSuffix || wouterPathFromParams(path);
  const isHome = !path?.length;
  const jsonLd = [
    ...buildGlobalJsonLdScripts(initialLocale),
    ...buildPageJsonLdStrings(initialLocale, path, publicPathSuffix),
  ];

  return (
    <>
      {jsonLd.map((raw, idx) => (
        <script key={`seo-ld-${idx}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: raw }} />
      ))}
      {isHome ? (
        <div id="home-ssr-hero" className="min-w-0 overflow-x-hidden">
          <StaticHomeMasterHero />
        </div>
      ) : null}
      <NextAppShell
        initialLocale={initialLocale}
        ssrPath={ssrPath}
        ssrSearch={ssrSearch}
      />
    </>
  );
}

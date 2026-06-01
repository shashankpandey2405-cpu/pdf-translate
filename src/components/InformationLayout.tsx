import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SITE_URL, SUPPORTED_LOCALES } from "@/lib/seo/site";
import { AiFactSheet } from "@/components/seo/AiFactSheet";

interface InformationLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Show AI platform fact sheet for crawlers */
  showAiFactSheet?: boolean;
  /** Skip default Helmet when page provides custom SEO */
  suppressHelmet?: boolean;
}

export default function InformationLayout({
  title,
  subtitle,
  children,
  showAiFactSheet = true,
  suppressHelmet = false,
}: InformationLayoutProps) {
  const { t, i18n } = useTranslation();
  const [pathname] = useLocation();
  const suffix = pathname === "/" ? "" : pathname;
  const canonicalUrl = `${SITE_URL}/${i18n.language}${suffix}`;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {!suppressHelmet ? (
        <Helmet>
          <title>{`${title} | PDFTrusted`}</title>
          <meta name="description" content={subtitle} />
          <link rel="canonical" href={canonicalUrl} />
          {SUPPORTED_LOCALES.map((loc) => (
            <link key={loc} rel="alternate" hrefLang={loc} href={`${SITE_URL}/${loc}${suffix}`} />
          ))}
          <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en${suffix}`} />
        </Helmet>
      ) : null}
      <section className="relative overflow-x-clip bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),_transparent_50%)]" />
        <div className="relative mx-auto w-full min-w-0 max-w-full px-[max(1rem,env(safe-area-inset-left))] py-14 pr-[max(1rem,env(safe-area-inset-right))] sm:py-20 lg:max-w-6xl lg:px-8">
          <div className="max-w-3xl min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 ring-1 ring-white/10">
              <BookOpen className="h-4 w-4 text-indigo-300" aria-hidden />
              {t("layout.infoCenter")}
            </span>
            <h1 id="info-page-title" className="display-h1 mt-6 text-white">{title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-300 sm:text-xl">{subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link
                href="/how-to-use"
                className="press-scale inline-flex min-h-[44px] items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t("layout.howToLink")}
              </Link>
              <Link
                href="/pricing"
                className="press-scale inline-flex min-h-[44px] items-center rounded-full border border-indigo-400/30 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500/30"
              >
                {t("layout.pricingLink", { defaultValue: "Pricing" })}
              </Link>
              <Link
                href="/about-us"
                className="press-scale inline-flex min-h-[44px] items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t("layout.aboutLink", { defaultValue: "About" })}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="info-page-content"
        aria-labelledby="info-page-title"
        className="app-page mx-auto w-full min-w-0 max-w-full px-[max(1rem,env(safe-area-inset-left))] py-12 pr-[max(1rem,env(safe-area-inset-right))] sm:py-16 lg:max-w-6xl lg:px-8"
      >
        <div className="min-w-0 space-y-12">
          {showAiFactSheet ? <AiFactSheet /> : null}
          {children}
        </div>
      </section>
    </div>
  );
}

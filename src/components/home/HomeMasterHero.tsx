"use client";

import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { HOME_MASTER_TOOLS } from "../../../constants/homeMasterGrid";
import { HomeLightNav } from "@/components/home/HomeLightNav";
import { HomePremiumComingSoonCta } from "@/components/home/HomePremiumComingSoonCta";
import { homeMasterIcon } from "@/components/home/homeMasterIcons";
import { cn } from "@/lib/utils";
import { loginAppPath } from "@/lib/appPaths";
import type { SupportedLanguage } from "@/i18n";

function HomeToolCard({
  slug,
  label,
  href,
}: {
  slug: string;
  label: string;
  href: string;
}) {
  const Icon = homeMasterIcon(slug);
  return (
    <Link
      href={href}
      className={cn(
        "home-tool-card group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10",
        "bg-white/[0.04] px-2 py-4 text-center transition-[border-color,box-shadow,background-color] duration-200",
        "hover:border-[#4F7CFF]/45 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(79,124,255,0.22)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F7CFF]",
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4F7CFF]/15 text-[#4F7CFF] transition-colors group-hover:bg-[#4F7CFF]/25">
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <span className="text-xs font-semibold leading-tight text-[#EAF0FF] sm:text-[13px]">{label}</span>
    </Link>
  );
}

export function HomeMasterHero() {
  const { t, i18n } = useTranslation();
  const startFreeHref = useMemo(() => {
    const lang = (i18n.language?.split("-")[0] || "en") as SupportedLanguage;
    return loginAppPath(lang, `/${lang}/all-tools`);
  }, [i18n.language]);

  useEffect(() => {
    document.documentElement.setAttribute("data-home-hydrated", "true");
    return () => document.documentElement.removeAttribute("data-home-hydrated");
  }, []);

  return (
    <div className="home-master relative min-h-[100dvh] overflow-x-hidden bg-[#0B1020] text-[#EAF0FF]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(168,85,247,0.28),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(79,124,255,0.2),transparent_50%),linear-gradient(180deg,#0B1020_0%,#121a32_45%,#0f1428_100%)]"
        aria-hidden
      />

      <HomeLightNav />

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[1.65rem] font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-[2.35rem]">
            {t("home.master.title", {
              defaultValue: "Welcome to PDFTrusted",
            })}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#EAF0FF]/75 sm:text-base">
            {t("home.master.subtitle", {
              defaultValue:
                "Compress, convert, edit, and sign PDFs — fast and private in your browser.",
            })}
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Link
              href={startFreeHref}
              className="home-cta-primary inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#4F7CFF] px-6 text-sm font-bold text-white shadow-[0_8px_32px_rgba(79,124,255,0.35)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] sm:w-auto sm:min-w-[180px]"
            >
              {t("home.master.ctaStart", { defaultValue: "Start Free Trial" })}
            </Link>
            <HomePremiumComingSoonCta variant="hero" />
            <Link
              href="/all-tools"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-bold text-[#EAF0FF] backdrop-blur-sm transition-colors hover:border-[#4F7CFF]/45 hover:bg-white/10 sm:w-auto sm:min-w-[140px]"
            >
              {t("home.master.ctaExplore", { defaultValue: "Explore" })}
            </Link>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAF0FF]/50">
            {t("home.master.popularLabel", { defaultValue: "Popular tools" })}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
            {HOME_MASTER_TOOLS.map((tool) => (
              <HomeToolCard
                key={tool.slug}
                slug={tool.slug}
                label={t(`home.master.tools.${tool.slug}`, { defaultValue: tool.label })}
                href={tool.routePath}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

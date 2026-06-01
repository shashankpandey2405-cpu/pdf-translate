import Image from "next/image";
import { HOME_MASTER_TOOLS } from "../../../constants/homeMasterGrid";
import { BRAND_LOGO_NAV_PATH, BRAND_ASSET_VERSION } from "@/lib/branding";
import { HOME_MASTER_DEFAULTS as m } from "@/components/home/homeMasterDefaults";
import { homeMasterIconLabel } from "@/components/home/homeMasterIconLabels";
import { loginLocaleHref } from "@/lib/appPaths";

const QUICK_LINKS = [
  { label: "Compress", href: "/compress-pdf" },
  { label: "Convert", href: "/universal-converter" },
  { label: "Edit", href: "/pdf-editor" },
  { label: "Sign", href: "/sign-pdf" },
] as const;

const logoSrc = `${BRAND_LOGO_NAV_PATH}?v=${BRAND_ASSET_VERSION}`;

/** Server-rendered LCP shell — hidden after client `HomeMasterHero` hydrates. */
export function StaticHomeMasterHero() {
  return (
    <div className="home-master relative min-h-[100dvh] overflow-x-hidden bg-[#0B1020] text-[#EAF0FF]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(168,85,247,0.28),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(79,124,255,0.2),transparent_50%),linear-gradient(180deg,#0B1020_0%,#121a32_45%,#0f1428_100%)]"
        aria-hidden
      />

      <header className="home-light-nav sticky top-0 z-50 border-b border-white/10 bg-[#0B1020]/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <a href="/" className="flex shrink-0 items-center gap-2" aria-label="PDFTrusted home">
              <Image src={logoSrc} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" priority />
              <span className="hidden font-bold tracking-tight text-[#EAF0FF] sm:inline">PDFTrusted</span>
            </a>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Quick tools">
              {QUICK_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#EAF0FF]/80"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#EAF0FF]/60"
              aria-hidden
            />
          </div>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[1.65rem] font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-[2.35rem]">
            {m.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#EAF0FF]/75 sm:text-base">
            {m.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <a
              href={loginLocaleHref("en", "/en/all-tools")}
              className="home-cta-primary inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#4F7CFF] px-6 text-sm font-bold text-white shadow-[0_8px_32px_rgba(79,124,255,0.35)] sm:w-auto sm:min-w-[180px]"
            >
              {m.ctaStart}
            </a>
            <div
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-transparent to-violet-500/10 px-5 py-3.5 text-center sm:min-w-[200px] sm:w-auto"
              role="status"
            >
              <span className="text-sm font-bold text-amber-100">{m.ctaPremiumTitle}</span>
              <span className="text-xs font-semibold text-[#EAF0FF]/90">{m.ctaPremiumBadge}</span>
              <span className="max-w-[220px] text-[11px] leading-snug text-[#EAF0FF]/55">{m.ctaPremiumSub}</span>
            </div>
            <a
              href="/all-tools"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-bold text-[#EAF0FF] backdrop-blur-sm sm:w-auto sm:min-w-[140px]"
            >
              {m.ctaExplore}
            </a>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAF0FF]/50">
            {m.popularLabel}
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
            {HOME_MASTER_TOOLS.map((tool) => (
                <a
                  key={tool.slug}
                  href={tool.routePath}
                  className="home-tool-card group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 text-center"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4F7CFF]/15 text-lg font-bold text-[#4F7CFF]"
                    aria-hidden
                  >
                    {homeMasterIconLabel(tool.slug)}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-[#EAF0FF] sm:text-[13px]">
                    {tool.label}
                  </span>
                </a>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link, useLocation } from "wouter";
import { Crown, LayoutDashboard } from "lucide-react";
import { brandLogoNavSrc } from "@/lib/branding";
import { DESKTOP_NAV_CATEGORIES, categoryForPath } from "@/lib/desktop/navCatalog";
import { DesktopMegaMenu } from "@/components/desktop/DesktopMegaMenu";
import { DesktopInlineSearch } from "@/components/desktop/DesktopInlineSearch";
import { AuthUserMenu } from "@/components/auth/AuthUserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { changeAppLanguage, type SupportedLanguage } from "@/i18n";
import { useAuthSession } from "@/hooks/useAuthSession";
import { LANGUAGES } from "../../../constants/tools";
import { cn } from "@/lib/utils";
import { isDesktopToolRoute } from "@/lib/desktop/isDesktopToolRoute";

export function DesktopTopNav() {
  const [location] = useLocation();
  const toolPageMode = isDesktopToolRoute(location);
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { t, i18n: i18nInstance } = useTranslation();
  const { isSignedIn, isLoading: authLoading } = useAuthSession();
  const lang = (i18nInstance.resolvedLanguage?.split("-")[0] ?? "en") as SupportedLanguage;
  const navRef = useRef<HTMLElement>(null);
  const activeCategory = categoryForPath(location) ?? (location.includes("compress") ? "compress" : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHovered(null);
  }, [location]);

  return (
    <header
      ref={navRef}
      className={cn(
        "desktop-top-nav sticky top-0 z-50 hidden w-full border-b border-border/60 lg:block",
        toolPageMode ? "h-14" : "h-[5.25rem]",
        scrolled
          ? "bg-white/90 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-xl"
          : "bg-white/75 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex h-full max-w-[1680px] items-center px-6 xl:px-10",
          toolPageMode ? "justify-between gap-4" : "gap-6",
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src={brandLogoNavSrc()} alt="PDFTrusted Logo" width={toolPageMode ? 34 : 42} height={toolPageMode ? 34 : 42} sizes="42px" className="rounded-xl" />
          <span className={cn("font-bold tracking-tight text-foreground", toolPageMode ? "text-lg" : "text-xl")}>
            PDF<span className="text-primary">Trusted</span>
          </span>
        </Link>

        {!toolPageMode ? (
          <nav className="relative flex flex-1 items-center justify-center gap-1" aria-label="Main">
            {DESKTOP_NAV_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const isOpen = hovered === cat.id;
              const highlighted = isActive || isOpen;
              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => setHovered(cat.id)}
                  onMouseLeave={() => setHovered((h) => (h === cat.id ? null : h))}
                >
                  <Link href={cat.primaryHref}>
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[14px] font-semibold transition-all duration-200",
                        highlighted
                          ? "bg-slate-100 text-foreground shadow-sm ring-1 ring-border/50"
                          : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          highlighted ? "bg-primary/12 text-primary" : "bg-muted/80 text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      {cat.label}
                    </span>
                  </Link>
                  <DesktopMegaMenu category={cat} open={isOpen} />
                </div>
              );
            })}
          </nav>
        ) : (
          <div className="hidden flex-1 justify-center px-4 xl:flex">
            <DesktopInlineSearch />
          </div>
        )}

        <div className={cn("flex shrink-0 items-center gap-2.5", toolPageMode && "ml-auto")}>
          {!toolPageMode ? (
            <div className="hidden w-[280px] xl:block">
              <DesktopInlineSearch />
            </div>
          ) : null}
          <label htmlFor="desktop-nav-lang" className="sr-only">
            {t("nav.language", { defaultValue: "Language" })}
          </label>
          <select
            id="desktop-nav-lang"
            value={lang}
            disabled={authLoading}
            onChange={(e) => void changeAppLanguage(e.target.value as SupportedLanguage)}
            className="h-11 min-w-[5.5rem] rounded-xl border border-border bg-card px-2.5 text-sm font-semibold text-foreground"
            aria-label={t("nav.language", { defaultValue: "Select language" })}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
          <Link
            href="/pricing"
            aria-label="View Premium Plans"
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition",
              "bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 text-amber-900",
              "border border-amber-400/40 shadow-sm hover:from-amber-500/25 hover:border-amber-500/60",
            )}
          >
            <Crown className="h-4 w-4 text-amber-600" aria-hidden />
            Premium
          </Link>
          {isSignedIn ? (
            <Link
              href="/account"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Dashboard
            </Link>
          ) : null}
          <ThemeToggle />
          <AuthUserMenu />
        </div>
      </div>
    </header>
  );
}

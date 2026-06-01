"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ChevronDown, History, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_ICONS, getToolGroups, getResourceLinks, getToolHref, LANGUAGES } from "../../constants/tools";
import { filterHeroToolGroups } from "../../constants/toolStatus";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import ThemeToggle from "./ThemeToggle";
import { useTranslation } from "react-i18next";
import { changeAppLanguage, type SupportedLanguage } from "@/i18n";
import { getPathLanguage, setStoredLanguage } from "@/lib/localization";
import { AuthUserMenu } from "@/components/auth/AuthUserMenu";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { preloadCommandPalette } from "@/lib/preloadCommandPalette";
import { useSafeAppBack } from "@/hooks/useSafeAppBack";
import { useHydrated } from "@/hooks/useHydrated";
import { PremiumRemainingBadge } from "@/components/processing/PremiumRemainingBadge";
import { cn } from "@/lib/utils";
import { brandLogoNavSrc } from "@/lib/branding";

type ToolItem = {
  label: string;
  slug: string;
  desc: string;
  routePath?: string;
};

type ToolGroup = {
  category: string;
  categoryKey: string;
  items: ToolItem[];
};

type ResourceLink = {
  label: string;
  href: string;
};

export default function Navbar() {
  const hydrated = useHydrated();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { t, i18n: i18nInstance } = useTranslation();
  const { setOpen } = useCommandPalette();
  const safeBack = useSafeAppBack("/");
  const toolGroups = filterHeroToolGroups(getToolGroups(t));
  const resourceLinks = getResourceLinks(t);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveDropdown(null);
    if (!hydrated) return;
    setCanGoBack(window.history.length > 1);
  }, [location, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [hydrated]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        const panel = document.getElementById("nav-tools-mega-panel");
        if (panel?.contains(e.target as Node)) return;
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (activeDropdown !== "Tools") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDropdown(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [activeDropdown]);

  const handleLanguageChange = (nextLanguage: SupportedLanguage) => {
    const pathname = window.location.pathname;
    const currentLang = getPathLanguage(pathname);
    const tailPath = currentLang ? pathname.replace(`/${currentLang}`, "") || "/" : pathname || "/";
    setStoredLanguage(nextLanguage);
    void changeAppLanguage(nextLanguage);
    window.location.assign(`/${nextLanguage}${tailPath}${window.location.search}${window.location.hash}`);
  };

  return (
    <header
      className={cn(
        "glass-nav sticky top-0 left-0 z-50 w-full max-w-full overflow-x-hidden border-b bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)] transition-all duration-300",
        hydrated && scrolled ? "navbar-scrolled shadow-sm" : "border-border/60",
      )}
    >
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-7xl items-center justify-between gap-2 px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:gap-3 sm:h-16 sm:px-6 lg:h-16">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3 shrink">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-11 sm:w-11">
            {hydrated && canGoBack ? (
              <button
                type="button"
                onClick={safeBack}
                className="tap-haptic touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-muted sm:h-11 sm:w-11"
                aria-label={t("nav.back", { defaultValue: "Back" })}
              >
                <ArrowLeft className="w-5 h-5" aria-hidden />
              </button>
            ) : null}
          </div>
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-foreground shrink-0"
            title="PDFTrusted"
          >
            <Image
              src={brandLogoNavSrc()}
              alt="PDFTrusted Logo"
              width={40}
              height={40}
              sizes="40px"
              priority
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-2xl bg-white/10 p-1 ring-1 ring-white/10 object-contain shadow-sm shadow-primary/20"
            />
            <span className="hidden text-base tracking-tight min-[400px]:inline sm:text-lg">
              PDF<span className="text-primary">Trusted</span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            preloadCommandPalette();
            setOpen(true);
          }}
          onMouseEnter={preloadCommandPalette}
          onFocus={preloadCommandPalette}
          aria-label={t("nav.searchTools")}
          className="hidden lg:flex flex-1 max-w-sm mx-4 items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2.5 text-sm text-muted-foreground backdrop-blur-md hover:border-indigo-400/40 dark:border-slate-700/50 dark:bg-slate-900/70"
        >
          <Search className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          <span className="truncate">{t("nav.searchTools")}</span>
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>

        <nav ref={dropdownRef} className="hidden md:flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-expanded={activeDropdown === "Tools"}
              aria-haspopup="true"
              aria-controls="nav-tools-mega-panel"
              onClick={() => setActiveDropdown(activeDropdown === "Tools" ? null : "Tools")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                activeDropdown === "Tools" && "border-primary/40 bg-primary/5",
              )}
            >
              {t("nav.tools")}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "Tools" ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {hydrated &&
              createPortal(
                <AnimatePresence>
                  {activeDropdown === "Tools" ? (
                    <>
                      <motion.div
                        key="tools-mega-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[45] hidden bg-black/20 backdrop-blur-[1px] md:block"
                        aria-hidden
                        onClick={() => setActiveDropdown(null)}
                      />
                      <motion.div
                        key="tools-mega-panel"
                        id="nav-tools-mega-panel"
                        role="menu"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          "fixed z-[50] max-h-[min(80vh,640px)] overflow-y-auto overscroll-contain scroll-touch",
                          "rounded-3xl border border-border bg-card/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-6",
                          "top-[calc(4rem+0.75rem)]",
                          "left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] w-auto",
                          "md:left-1/2 md:right-auto md:w-[min(calc(100vw-1.5rem),72rem)] md:-translate-x-1/2",
                        )}
                      >
                    <div className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4 xl:grid-cols-6 sm:gap-4">
                      {toolGroups.map((group: ToolGroup) => (
                        <div key={group.category} className="min-w-0">
                          <div className="mb-3 flex items-center gap-2 border-b border-border pb-2 sm:mb-4 sm:pb-3">
                            <span className="text-base shrink-0">{CATEGORY_ICONS[group.categoryKey]}</span>
                            <span className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.24em]">
                              {group.category}
                            </span>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            {group.items.map((item: ToolItem) => (
                              <Link
                                key={item.slug}
                                href={getToolHref(item)}
                                role="menuitem"
                                onClick={() => setActiveDropdown(null)}
                                className="block min-w-0 rounded-2xl px-2 py-2 transition-colors hover:bg-primary/5 sm:px-3 sm:py-3"
                              >
                                <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                                <p className="line-clamp-2 text-xs text-muted-foreground">{item.desc}</p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-3xl border border-border bg-background p-3 sm:mt-6 sm:gap-3 sm:p-4 min-[900px]:grid-cols-3">
                      {resourceLinks.map((link: ResourceLink) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setActiveDropdown(null)}
                          className="rounded-2xl border border-border bg-card px-3 py-2.5 text-center text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 sm:px-4 sm:py-3 sm:text-sm"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <PwaInstallButton variant="outline" className="col-span-2 w-full justify-center px-3 py-2.5 text-xs font-medium min-[900px]:col-span-1 sm:px-4 sm:py-3 sm:text-sm" />
                    </div>
                      </motion.div>
                    </>
                  ) : null}
                </AnimatePresence>,
                document.body,
              )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/pricing"
            aria-label={t("nav.premium", { defaultValue: "View Premium Plans" })}
            className="press-scale inline-flex min-h-10 items-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:brightness-110"
          >
            {t("home.hero.ctaPremium", { defaultValue: "Premium" })}
          </Link>
          <label htmlFor="language-select" className="sr-only">
            {t("nav.language", { defaultValue: "Language" })}
          </label>
          <select
            id="language-select"
            name="language"
            aria-label={t("nav.language", { defaultValue: "Select language" })}
            value={i18nInstance.resolvedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="h-10 rounded-2xl border border-border bg-card px-3 text-sm text-foreground"
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
          <Link
            href="/recent"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            aria-label={t("history.recentActivity", { defaultValue: "Recent activity" })}
            title={t("history.recentActivity", { defaultValue: "Recent activity" })}
          >
            <History className="h-4 w-4 text-primary" aria-hidden />
          </Link>
          <ThemeToggle />
          <PremiumRemainingBadge compact />
          <AuthUserMenu />
          <PwaInstallButton variant="primary" />
        </div>

        <div className="flex min-w-0 shrink items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => {
              preloadCommandPalette();
              setOpen(true);
            }}
            aria-label={t("nav.searchTools")}
            className="press-scale inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-white/70 text-foreground backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/70"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}



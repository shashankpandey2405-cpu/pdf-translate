"use client";

import Image from "next/image";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { changeAppLanguage, type SupportedLanguage } from "@/i18n";
import { LANGUAGES } from "../../../constants/tools";
import { brandLogoNavSrc } from "@/lib/branding";
import { HomePremiumComingSoonCta } from "@/components/home/HomePremiumComingSoonCta";
const QUICK_LINKS = [
  { label: "Compress", href: "/compress-pdf" },
  { label: "Convert", href: "/universal-converter" },
  { label: "Edit", href: "/pdf-editor" },
  { label: "Sign", href: "/sign-pdf" },
] as const;

export function HomeLightNav() {
  const { setOpen } = useCommandPalette();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.split("-")[0] ?? "en") as SupportedLanguage;

  return (
    <header className="home-light-nav sticky top-0 z-50 border-b border-white/10 bg-[#0B1020]/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="PDFTrusted home">
            <Image src={brandLogoNavSrc()} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" priority />
            <span className="hidden font-bold tracking-tight text-[#EAF0FF] sm:inline">PDFTrusted</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Quick tools">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#EAF0FF]/80 transition-colors hover:bg-white/10 hover:text-[#EAF0FF]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <label className="sr-only" htmlFor="home-nav-lang">
            {t("nav.language", { defaultValue: "Language" })}
          </label>
          <select
            id="home-nav-lang"
            value={lang}
            onChange={(e) => void changeAppLanguage(e.target.value as SupportedLanguage)}
            className="h-9 w-[3.25rem] shrink-0 rounded-xl border border-white/15 bg-white/5 px-1 text-[10px] font-bold text-[#EAF0FF] sm:h-10 sm:w-auto sm:max-w-[5.5rem] sm:px-1.5 sm:text-[11px] md:text-xs"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="hidden sm:block">
            <HomePremiumComingSoonCta variant="nav" />
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#EAF0FF] transition-colors hover:border-[#4F7CFF]/50 hover:bg-[#4F7CFF]/15"
            aria-label="Search tools"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Image from "next/image";
import { Link } from "wouter";
import { Search, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage, type SupportedLanguage } from "@/i18n";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { LANGUAGES } from "../../../constants/tools";
import { brandLogoNavSrc } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Lightweight fixed tool header — logo, language, search, tools. */
export function MobileToolChromeHeader({ className }: Props) {
  const { t, i18n: i18nInstance } = useTranslation();
  const { setOpen } = useCommandPalette();
  const lang = (i18nInstance.language?.split("-")[0] ?? "en") as SupportedLanguage;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)] lg:hidden",
        className,
      )}
    >
      <div className="flex h-12 items-center justify-between gap-2 px-3">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2">
          <Image src={brandLogoNavSrc()} alt="" width={28} height={28} className="h-7 w-7 rounded-md" priority />
          <span className="truncate text-sm font-bold tracking-tight text-foreground">PDFTrusted</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <label className="sr-only" htmlFor="mobile-tool-lang">
            Language
          </label>
          <select
            id="mobile-tool-lang"
            value={lang}
            onChange={(e) => void changeAppLanguage(e.target.value as SupportedLanguage)}
            className="h-9 max-w-[4.5rem] rounded-lg border border-border bg-card px-1.5 text-[11px] font-semibold text-foreground"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" />
          </button>
          <Link
            href="/all-tools"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground"
            aria-label={t("nav.tools", { defaultValue: "Tools" })}
          >
            <Wrench className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

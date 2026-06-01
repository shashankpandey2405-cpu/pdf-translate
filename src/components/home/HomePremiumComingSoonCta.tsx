"use client";

import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Variant = "hero" | "nav";

type Props = {
  variant?: Variant;
  className?: string;
};

/** Premium CTA — no price, no /pricing link. Launch messaging only. */
export function HomePremiumComingSoonCta({ variant = "hero", className }: Props) {
  const { t } = useTranslation();

  if (variant === "nav") {
    return (
      <span
        className={cn(
          "inline-flex max-w-[9.5rem] flex-col items-end gap-0 rounded-xl border border-amber-400/35 bg-amber-500/10 px-2.5 py-1.5 text-right sm:max-w-none sm:flex-row sm:items-center sm:gap-2 sm:text-left",
          className,
        )}
        aria-label={t("home.master.ctaPremiumTitle", { defaultValue: "Premium — coming soon" })}
      >
        <Crown className="hidden h-3.5 w-3.5 shrink-0 text-amber-500 sm:block" aria-hidden />
        <span className="text-[10px] font-bold leading-tight text-amber-100 sm:text-xs">
          {t("home.master.ctaPremiumTitle", { defaultValue: "Premium" })}
        </span>
        <span className="text-[9px] font-medium leading-tight text-[#EAF0FF]/60 sm:text-[10px]">
          {t("home.master.ctaPremiumBadge", { defaultValue: "Coming Soon · 1 July" })}
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-transparent to-violet-500/10 px-5 py-3.5 text-center sm:min-w-[200px] sm:w-auto",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-100">
        <Crown className="h-4 w-4 text-amber-400" aria-hidden />
        {t("home.master.ctaPremiumTitle", { defaultValue: "Premium" })}
      </span>
      <span className="text-xs font-semibold text-[#EAF0FF]/90">
        {t("home.master.ctaPremiumBadge", { defaultValue: "Coming Soon — Launching 1 July" })}
      </span>
      <span className="max-w-[220px] text-[11px] leading-snug text-[#EAF0FF]/55">
        {t("home.master.ctaPremiumSub", {
          defaultValue: "Advanced AI & Cloud Tools arriving soon",
        })}
      </span>
    </div>
  );
}

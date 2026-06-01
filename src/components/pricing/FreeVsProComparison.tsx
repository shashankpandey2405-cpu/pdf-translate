"use client";

import { Check, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { Link } from "wouter";
import { authOnlyProductMode } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";

const ROWS = [
  { key: "ai", free: "basic", pro: true },
  { key: "compress", free: "standard", pro: true },
  { key: "ocr", free: "standard", pro: true },
  { key: "bulk", free: "limited", pro: true },
  { key: "ads", free: "yes", pro: false },
  { key: "privacy", free: "standard", pro: true },
  { key: "support", free: "community", pro: true },
] as const;

export function FreeVsProComparison() {
  const { t } = useTranslation();

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200/50 bg-white/40 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/40">
      <div className="sticky top-16 z-10 grid grid-cols-[1.2fr_1fr_1.1fr] border-b border-slate-200/60 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/90 sm:px-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t("pricingPage.freeVsPro.feature", { defaultValue: "Feature" })}
        </span>
        <span className="text-center text-sm font-bold text-slate-700 dark:text-slate-300">
          {t("pricingPage.plans.free.label", { defaultValue: "Free" })}
        </span>
        <span className="text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {t("pricingPage.plans.pro.label", { defaultValue: "Pro" })}
        </span>
      </div>

      <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
        {ROWS.map(({ key, free, pro }) => (
          <div
            key={key}
            className="grid grid-cols-[1.2fr_1fr_1.1fr] items-center gap-2 px-4 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 sm:px-6"
          >
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {t(`pricingPage.freeVsPro.rows.${key}.label`)}
            </span>
            <span className="text-center text-xs text-slate-500 sm:text-sm">
              {typeof free === "string" ? t(`pricingPage.freeVsPro.rows.${key}.free`) : "—"}
            </span>
            <span className="flex items-center justify-center gap-1 text-center text-xs font-medium text-indigo-700 dark:text-indigo-300 sm:text-sm">
              {pro ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" aria-hidden />
                  {t(`pricingPage.freeVsPro.rows.${key}.pro`)}
                </>
              ) : (
                <Minus className="h-4 w-4 text-slate-400" aria-hidden />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.2fr_1fr_1.1fr] gap-2 border-t border-slate-200/60 p-4 sm:p-6 dark:border-slate-800">
        <span />
        <span />
        <div
          className={cn(
            "flex flex-col items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/[0.06] p-4",
            "shadow-[0_0_30px_rgba(79,70,229,0.1)]",
          )}
        >
          {authOnlyProductMode() ? (
            <Link
              href="/login"
              className="shimmer-btn press-scale inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:brightness-110"
            >
              {t("pricingPage.freeVsPro.cta", { defaultValue: "Get Pro Now" })}
            </Link>
          ) : (
            <CheckoutButton
              product="premium_monthly"
              signInReason="Sign in to upgrade to Pro."
              className="shimmer-btn press-scale inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:brightness-110"
            >
              {t("pricingPage.freeVsPro.cta", { defaultValue: "Get Pro Now" })}
            </CheckoutButton>
          )}
          <p className="mt-2 text-center text-[11px] text-slate-500">
            {t("pricingPage.freeVsPro.trustLine", { defaultValue: "Cancel anytime. No hidden fees." })}
          </p>
        </div>
      </div>
    </section>
  );
}

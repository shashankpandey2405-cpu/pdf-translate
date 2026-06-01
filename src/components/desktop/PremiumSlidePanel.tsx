"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crown, X } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { usePremiumUpsell } from "@/context/PremiumUpsellContext";
import { formatUsd, premiumPrice, PRICING } from "@/lib/pricing/plans";
import { useBillingState } from "@/hooks/useBillingState";

export function PremiumSlidePanel() {
  const { open, closePremium } = usePremiumUpsell();
  const { t } = useTranslation();
  const billing = useBillingState();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePremium();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePremium]);

  const premiumFeatures = [
    "pricingPage.plans.premium.feature1",
    "pricingPage.plans.premium.feature2",
    "pricingPage.plans.premium.feature3",
    "pricingPage.plans.premium.feature4",
    "pricingPage.plans.premium.feature5",
    "pricingPage.plans.premium.feature6",
  ];

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] hidden bg-slate-950/40 backdrop-blur-sm lg:block"
            onClick={closePremium}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 left-0 z-[81] hidden w-1/2 min-w-[400px] max-w-[560px] overflow-y-auto border-r border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl lg:block"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
                  <Crown className="h-6 w-6 text-slate-950" />
                </span>
                <div>
                  <p className="text-lg font-bold">PDFTrusted Premium</p>
                  <p className="text-xs text-white/60">
                    {t("pricingPage.plans.premium.tagline")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePremium}
                className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-violet-500/10 p-5 ring-1 ring-amber-400/20">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
                  <Crown className="h-4 w-4" />
                  {t("pricingPage.plans.premium.label")}
                </p>
                <p className="mt-2 text-3xl font-extrabold">
                  {premiumPrice("monthly")}
                  <span className="text-lg font-semibold text-white/60">
                    {t("pricingPage.billing.perMonth")}
                  </span>
                </p>
                <ul className="mt-4 space-y-2">
                  {premiumFeatures.map((key) => (
                    <li key={key} className="flex gap-2 text-sm text-white/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  onClick={closePremium}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:brightness-110"
                >
                  {t("pricingPage.plans.premium.cta")}
                </Link>
              </div>

              {billing.showExtraCreditsPurchase ? (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t("pricingPage.credits.title")}
                  </p>
                  <p className="mt-2 text-sm text-white/75">{t("pricingPage.credits.exhaustedHeading")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PRICING.creditPacks.map((pack) => (
                      <span
                        key={pack.credits}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80"
                      >
                        {pack.credits} · {formatUsd(pack.usd)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="text-center text-[11px] text-white/45">{t("pricingPage.credits.termsNote")}</p>
              <Link
                href="/pricing"
                onClick={closePremium}
                className="block text-center text-xs font-medium text-amber-300/90 hover:text-amber-200"
              >
                Compare all plans →
              </Link>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

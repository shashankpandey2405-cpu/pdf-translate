"use client";

import { useState } from "react";
import { Link } from "wouter";
import { Briefcase, Gift, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  premiumPrice,
  creditPackPrice,
  PRICING,
  BILLING_CURRENCY,
  type BillingCycle,
} from "@/lib/pricing/plans";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";
import { authOnlyProductMode } from "@/lib/featureFlags";
import { useBillingState } from "@/hooks/useBillingState";
import { ProPlanBenefits } from "@/components/pricing/ProPlanBenefits";

function BillingToggle({
  cycle,
  onCycleChange,
}: {
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className={cn("text-sm font-medium", cycle === "monthly" ? "text-slate-900" : "text-slate-500")}>
        {t("pricingPage.billing.monthly")}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={cycle === "yearly"}
        aria-label={t("pricingPage.billing.toggleLabel")}
        onClick={() => onCycleChange(cycle === "monthly" ? "yearly" : "monthly")}
        className={cn(
          "relative h-8 w-14 rounded-full transition-colors",
          cycle === "yearly" ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
            cycle === "yearly" ? "left-7" : "left-1",
          )}
        />
      </button>
      <span className={cn("text-sm font-medium", cycle === "yearly" ? "text-slate-900" : "text-slate-500")}>
        {t("pricingPage.billing.yearly")}
      </span>
      {cycle === "yearly" ? (
        <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {t("pricingPage.billing.save20", { defaultValue: "Save 20%" })}
        </span>
      ) : null}
      {cycle === "yearly" ? (
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          {t("pricingPage.billing.mostPopular", { defaultValue: "Most Popular" })}
        </span>
      ) : null}
    </div>
  );
}

export function PricingPlans() {
  const { t } = useTranslation();
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const billing = useBillingState();
  const premiumUsd = premiumPrice(cycle);

  const freeFeatures = [
    "pricingPage.plans.free.feature1",
    "pricingPage.plans.free.feature2",
    "pricingPage.plans.free.feature3",
  ];

  const teamFeatures = [
    "pricingPage.plans.team.feature1",
    "pricingPage.plans.team.feature2",
    "pricingPage.plans.team.feature3",
    "pricingPage.plans.team.feature4",
    "pricingPage.plans.team.feature5",
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-center gap-4 text-center sm:gap-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("pricingPage.trust.moneyBack", { defaultValue: "14-day refunds per Refund Policy" })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          {t("pricingPage.trust.pci", { defaultValue: "Secure checkout via PayPal" })}
        </span>
      </div>

      <BillingToggle cycle={cycle} onCycleChange={setCycle} />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {/* Free */}
        <div className="flex flex-col rounded-3xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-md sm:p-8 dark:border-slate-700/50 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-slate-500" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {t("pricingPage.plans.free.label", { defaultValue: "Free" })}
            </p>
          </div>
          <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("pricingPage.plans.free.price")}
          </p>
          <p className="mt-2 text-sm text-slate-500">{t("pricingPage.plans.free.tagline")}</p>
          <ul className="mt-6 flex-1 space-y-3">
            {freeFeatures.map((key) => (
              <li key={key} className="text-sm text-slate-500">
                • {t(key)}
              </li>
            ))}
          </ul>
          <Link
            href="/all-tools"
            className="press-scale mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-600 dark:text-white"
          >
            {t("pricingPage.plans.free.cta")}
          </Link>
        </div>

        {/* Pro — hero */}
        <div className="relative flex flex-col rounded-3xl border-2 border-indigo-500/50 bg-white/80 p-6 shadow-[0_0_40px_rgba(79,70,229,0.12)] ring-1 ring-indigo-400/20 sm:p-8 dark:bg-slate-900/80">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {t("pricingPage.plans.pro.ribbon", { defaultValue: "Best Value" })}
          </span>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              {t("pricingPage.plans.pro.label", { defaultValue: "Pro" })}
            </p>
          </div>
          <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {premiumUsd}
            <span className="ml-1 text-lg font-semibold text-slate-500">
              {cycle === "yearly" ? t("pricingPage.billing.perYear") : t("pricingPage.billing.perMonth")}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            {t("pricingPage.billing.usdNote", { currency: BILLING_CURRENCY })}
          </p>
          <p className="mt-2 text-sm text-slate-500">{t("pricingPage.plans.pro.tagline")}</p>
          <div className="mt-6 flex-1">
            <ProPlanBenefits />
          </div>
          {authOnlyProductMode() ? (
            <Link
              href="/login"
              className="shimmer-btn press-scale mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:brightness-110"
            >
              {t("pricingPage.plans.pro.cta", { defaultValue: "Get Pro" })}
            </Link>
          ) : (
            <CheckoutButton
              product={cycle === "yearly" ? "premium_yearly" : "premium_monthly"}
              signInReason="Sign in to upgrade to Pro."
              className="shimmer-btn press-scale mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:brightness-110"
            >
              {t("pricingPage.plans.pro.cta", { defaultValue: "Get Pro" })}
            </CheckoutButton>
          )}
        </div>

        {/* Team */}
        <div className="flex flex-col rounded-3xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-md sm:p-8 dark:border-slate-700/50 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-slate-500" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {t("pricingPage.plans.team.label", { defaultValue: "Team" })}
            </p>
          </div>
          <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("pricingPage.plans.team.price", { defaultValue: "Let's talk" })}
          </p>
          <p className="mt-2 text-sm text-slate-500">{t("pricingPage.plans.team.tagline")}</p>
          <ul className="mt-6 flex-1 space-y-3">
            {teamFeatures.map((key) => (
              <li key={key} className="text-sm text-slate-500">
                • {t(key)}
              </li>
            ))}
          </ul>
          <a
            href="mailto:support@pdftrusted.com?subject=PDFTrusted%20Team%20plan"
            className="press-scale mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-slate-900/20 px-4 py-3 text-sm font-bold text-slate-900 dark:border-white/20 dark:text-white"
          >
            {t("pricingPage.plans.team.cta", { defaultValue: "Contact sales" })}
          </a>
        </div>
      </div>

      {/* Credit packs — keep existing logic */}
      <section className="rounded-3xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-md sm:p-8 dark:border-slate-700/50 dark:bg-slate-900/60">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("pricingPage.credits.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{t("pricingPage.credits.desc", { count: PRICING.premium.aiCreditsPerMonth })}</p>
        {billing.showExtraCreditsPurchase ? (
          <div id="credit-packs" className="mt-6 grid gap-4 sm:grid-cols-3">
            {PRICING.creditPacks.map((pack, index) => {
              const productId = (["credits_100", "credits_500", "credits_2000"] as CheckoutProductId[])[index];
              return (
                <div key={pack.credits} className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-2xl font-extrabold">{pack.credits}</p>
                  <p className="mt-3 text-lg font-bold text-indigo-600">{creditPackPrice(pack.usd)}</p>
                  <CheckoutButton product={productId} signInReason="Sign in to buy credits." className="mt-4 w-full rounded-xl border border-indigo-400/40 py-2 text-xs font-bold text-indigo-600">
                    {t("pricingPage.credits.buyCta", { defaultValue: "Buy credits" })}
                  </CheckoutButton>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}

"use client";

import { Crown, Gift, Check, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PRICING } from "@/lib/pricing/plans";

type Props = {
  isPremium: boolean;
  premiumUntil?: string | null;
};

const PREMIUM_PERKS = [
  "All PDF tools — browser & cloud",
  "Advanced OCR for scanned docs",
  "500 AI credits every month",
  "AI summarize, translate & chat",
  "No ads in workspace",
  "Priority processing queue",
  "Buy extra credit packs",
];

const FREE_PERKS = [
  "All basic PDF tools in browser (free, no login)",
  `${PRICING.free.aiCreditsPerMonth} cloud + AI credits / month after sign-in`,
  "Trusted Cloud OCR, compress & convert",
  "Ad-supported workspace",
];

export function AccountPlanCard({ isPremium, premiumUntil }: Props) {
  const { t } = useTranslation();

  const expiryLabel = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const perks = isPremium ? PREMIUM_PERKS : FREE_PERKS;

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        isPremium
          ? "border-amber-400/50 bg-gradient-to-br from-amber-50 via-card to-card"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        {isPremium ? (
          <Crown className="h-5 w-5 text-amber-600" />
        ) : (
          <Gift className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-bold text-foreground">
            {isPremium ? "Premium" : "Free"}{" "}
            <span className="font-normal text-muted-foreground">plan</span>
          </p>
          {isPremium && expiryLabel && (
            <p className="text-xs text-muted-foreground">
              Active until {expiryLabel}
            </p>
          )}
        </div>
        {!isPremium && (
          <Link
            href="/pricing"
            className="ml-auto rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            {t("account.upgradeCta", { defaultValue: "Upgrade" })}
          </Link>
        )}
        {isPremium && (
          <Sparkles className="ml-auto h-4 w-4 text-amber-500" />
        )}
      </div>

      <ul className="mt-4 space-y-1.5">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPremium ? "text-amber-600" : "text-emerald-600"}`} />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      {!isPremium && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Upgrade to Premium to unlock all tools, more credits, and extra credit packs.
        </p>
      )}
    </div>
  );
}

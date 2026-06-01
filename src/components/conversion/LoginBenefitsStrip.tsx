"use client";

import { Cloud, Gift, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearch } from "wouter";

type Props = {
  className?: string;
};

/** Value props above login form — stronger when redirected from /account. */
export function LoginBenefitsStrip({ className }: Props) {
  const { t } = useTranslation();
  const search = useSearch();
  const fromAccount =
    typeof window !== "undefined" &&
    (search.includes("intent=account") || search.includes("from=account"));

  return (
    <div
      className={
        className ??
        "mb-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 via-primary/5 to-transparent p-4 text-left"
      }
    >
      <p className="text-sm font-semibold text-foreground">
        {fromAccount
          ? t("conversion.login.fromAccountTitle", {
              defaultValue: "Unlock your workspace",
            })
          : t("conversion.login.title", {
              defaultValue: "Free account — 10 credits every month",
            })}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {fromAccount
          ? t("conversion.login.fromAccountBody", {
              defaultValue:
                "Sign in to save cloud job history, track credits, and run Turbo Cloud + AI on your PDFs.",
            })
          : t("conversion.login.body", {
              defaultValue:
                "Browser merge & compress stay free without signup. Google sign-in unlocks Turbo Cloud and AI tools.",
            })}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        <li className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Gift className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
          {t("conversion.login.benefitCredits", { defaultValue: "10 credits/month" })}
        </li>
        <li className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Cloud className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {t("conversion.login.benefitCloud", { defaultValue: "Turbo Cloud OCR & translate" })}
        </li>
        <li className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          {t("conversion.login.benefitPrivate", { defaultValue: "Private Local tools still free" })}
        </li>
      </ul>
      {fromAccount ? (
        <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-primary">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t("conversion.login.accountHint", {
            defaultValue: "You tried to open My account — one tap with Google to continue.",
          })}
        </p>
      ) : null}
    </div>
  );
}

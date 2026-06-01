"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Gift, ShieldCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/context/PremiumContext";
import { signInWithGoogle } from "@/lib/authClient";
import { logConversionEvent } from "@/utils/logger";

const DISMISS_KEY = "pdftrusted-signup-nudge-dismissed";

export function PostResultSignupNudge() {
  const { t } = useTranslation();
  const { isSignedIn } = usePremium();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn || dismissed) return;
    logConversionEvent("post_result_nudge_shown");
  }, [isSignedIn, dismissed]);

  if (isSignedIn || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const handleGoogle = async () => {
    setLoading(true);
    logConversionEvent("post_result_nudge_click");
    try {
      await signInWithGoogle(window.location.pathname);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/8 via-primary/5 to-transparent p-4 sm:p-5">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            {t("conversion.postResult.title", { defaultValue: "Your PDF is ready" })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("conversion.postResult.subtitle", {
              defaultValue:
                "Create a free account to save history, run Turbo Cloud, and get 10 credits/month.",
            })}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Gift className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
          {t("authWorkspace.benefitLimits", {
            defaultValue: "10 free credits every month (Turbo Cloud + AI)",
          })}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          {t("conversion.postResult.trust", {
            defaultValue: "Browser tools stay free without signup. We never sell your documents.",
          })}
        </li>
      </ul>

      <button
        type="button"
        disabled={loading}
        onClick={handleGoogle}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {t("conversion.postResult.cta", { defaultValue: "Continue with Google" })}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
        {t("conversion.postResult.ctaSub", {
          defaultValue: "10 free credits/month · No credit card",
        })}
      </p>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Link } from "wouter";
import { Gift, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/context/PremiumContext";
import { signInWithGoogle } from "@/lib/authClient";
import { logConversionEvent } from "@/utils/logger";

/**
 * Guest-only banner on /pricing — start free or sign in for monthly credits.
 */
export function PricingGuestBanner() {
  const { t } = useTranslation();
  const { isSignedIn } = usePremium();
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    logConversionEvent("pricing_guest_signin_click");
    try {
      await signInWithGoogle("/pricing");
    } catch {
      setLoading(false);
    }
  }, []);

  if (isSignedIn) return null;

  return (
    <div className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-primary/5 to-transparent p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Gift className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {t("conversion.pricing.guestTitle", {
                defaultValue: "Start free — upgrade when you need Turbo Cloud",
              })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("conversion.pricing.guestBody", {
                defaultValue:
                  "Browser merge, compress & edit need no account. Sign in for 10 credits/month on AI & cloud tools.",
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/merge-pdf"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            onClick={() => logConversionEvent("pricing_guest_free_tools")}
          >
            {t("conversion.pricing.ctaFree", { defaultValue: "Try merge PDF free" })}
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleGoogle()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {t("conversion.pricing.ctaGoogle", { defaultValue: "Continue with Google — 10 credits/mo" })}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Gift, Sparkles, X } from "lucide-react";
import { usePremium } from "@/context/PremiumContext";
import {
  getGuestEngagement,
  isReturningEngagedGuest,
} from "@/lib/conversion/guestEngagement";
import { logConversionEvent } from "@/utils/logger";
import { signInWithGoogle } from "@/lib/authClient";
import { cn } from "@/lib/utils";

const DISMISS_SESSION_KEY = "pdftrusted-returning-banner-dismissed";

type Props = {
  className?: string;
};

/**
 * Shown to guests who returned or completed a free browser tool — stronger signup CTA.
 */
export function ReturningGuestBanner({ className }: Props) {
  const { t } = useTranslation();
  const { isSignedIn } = usePremium();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      setVisible(false);
      return;
    }
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DISMISS_SESSION_KEY) === "1") return;
    if (!isReturningEngagedGuest()) return;
    setVisible(true);
    logConversionEvent("returning_guest_banner_shown", {
      visits: getGuestEngagement().visits,
      successes: getGuestEngagement().successes,
    });
  }, [isSignedIn]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    } catch {}
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    logConversionEvent("returning_guest_banner_click");
    try {
      await signInWithGoogle(window.location.pathname);
    } catch {
      setLoading(false);
    }
  };

  if (!visible || isSignedIn) return null;

  const { lastTool } = getGuestEngagement();
  const toolHref = lastTool ? `/${lastTool}` : "/merge-pdf";

  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[34] mx-auto max-w-7xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 lg:top-[calc(4rem+env(safe-area-inset-top))]",
        className,
      )}
      role="region"
      aria-label={t("conversion.returning.title", { defaultValue: "Save your PDF work" })}
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-indigo-500/25 bg-card/95 bg-gradient-to-r from-indigo-500/10 via-primary/5 to-transparent p-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Gift className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t("conversion.returning.title", { defaultValue: "Save your PDF work — free account" })}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {t("conversion.returning.body", {
                defaultValue:
                  "Continue with Google for history, Turbo Cloud, and 10 credits/month. Browser merge & compress stay free.",
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleGoogle()}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground sm:flex-none sm:px-4 sm:text-sm"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            )}
            {t("conversion.returning.cta", { defaultValue: "Continue with Google" })}
          </button>
          <Link
            href={toolHref}
            onClick={dismiss}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground sm:flex-none sm:text-sm"
          >
            {t("conversion.returning.continueFree", { defaultValue: "Keep using free tools" })}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-2 top-2 rounded-lg p-1 text-muted-foreground hover:text-foreground sm:static"
            aria-label={t("conversion.returning.dismiss", { defaultValue: "Dismiss" })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

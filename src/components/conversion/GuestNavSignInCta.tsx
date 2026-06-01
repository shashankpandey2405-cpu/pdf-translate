"use client";

import { useCallback, useState } from "react";
import { Gift, Loader2, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { assertAuthApiReachable, signInWithGoogle } from "@/lib/authClient";
import { isReturningEngagedGuest } from "@/lib/conversion/guestEngagement";
import { logConversionEvent } from "@/utils/logger";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  postLoginPath: string;
  className?: string;
  onNavigate?: () => void;
};

/**
 * Navbar sign-in control — highlights 10 credits/month for returning engaged guests.
 */
export function GuestNavSignInCta({ postLoginPath, className, onNavigate }: Props) {
  const { t } = useTranslation();
  const [googleBusy, setGoogleBusy] = useState(false);
  const engaged = typeof window !== "undefined" && isReturningEngagedGuest();

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleBusy(true);
    logConversionEvent("nav_signin_click", { engaged: engaged ? 1 : 0 });
    try {
      const probe = await assertAuthApiReachable();
      if (!probe.ok) {
        toast.error(t(probe.i18nKey), probe.detail ? { description: probe.detail } : undefined);
        return;
      }
      onNavigate?.();
      const result = await signInWithGoogle(postLoginPath);
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setGoogleBusy(false);
    }
  }, [engaged, onNavigate, postLoginPath, t]);

  return (
    <button
      type="button"
      disabled={googleBusy}
      onClick={() => void handleGoogleSignIn()}
      className={cn(
        "inline-flex min-h-[40px] items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 sm:px-4",
        engaged
          ? "border-indigo-500/35 bg-gradient-to-r from-indigo-500/10 to-primary/5 text-foreground hover:border-indigo-500/50"
          : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5",
        className,
      )}
    >
      {googleBusy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : engaged ? (
        <Gift className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
      ) : (
        <LogIn className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="flex flex-col items-start leading-tight">
        <span className="hidden sm:inline">
          {engaged
            ? t("conversion.nav.ctaEngaged", { defaultValue: "Continue with Google" })
            : t("nav.continueWithGoogle", { defaultValue: "Continue with Google" })}
        </span>
        <span className="sm:hidden">{t("nav.login", { defaultValue: "Login" })}</span>
        {engaged ? (
          <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline">
            {t("conversion.nav.creditsSub", { defaultValue: "10 credits/month · free account" })}
          </span>
        ) : null}
      </span>
    </button>
  );
}

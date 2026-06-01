"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "ai" | "cloud";
  title?: string;
  subtitle?: string;
  /** Primary button label when guest (Google CTA). */
  guestCta?: string;
  /** Primary button when already signed in. */
  signedInCta?: string;
  onStart: () => void;
  loading?: boolean;
  disabled?: boolean;
  isSignedIn?: boolean;
  className?: string;
};

/**
 * Shown after upload, before cloud/AI processing — delayed signup pattern.
 * User sees preview + value first; login only when they tap Start.
 */
export function DeferredStartPanel({
  variant = "ai",
  title,
  subtitle,
  guestCta,
  signedInCta,
  onStart,
  loading = false,
  disabled = false,
  isSignedIn = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const isAi = variant === "ai";

  const resolvedTitle =
    title ??
    t(isAi ? "conversion.deferred.titleAi" : "conversion.deferred.titleCloud", {
      defaultValue: isAi ? "Your document is ready" : "Ready for Turbo Cloud",
    });

  const resolvedSubtitle =
    subtitle ??
    t(isAi ? "conversion.deferred.subtitleAi" : "conversion.deferred.subtitleCloud", {
      defaultValue: isAi
        ? "Preview looks good? Start AI processing — sign in only when you continue."
        : "File uploaded securely. Continue with Google to run on Turbo Cloud (+ 10 credits/month).",
    });

  const buttonLabel = isSignedIn
    ? (signedInCta ??
      t(isAi ? "conversion.deferred.startAi" : "conversion.deferred.startCloud", {
        defaultValue: isAi ? "Start AI processing" : "Run Turbo Cloud",
      }))
    : (guestCta ??
      t(isAi ? "conversion.deferred.ctaAiGuest" : "conversion.deferred.ctaCloudGuest", {
        defaultValue: "Continue with Google — Get 10 credits/month",
      }));

  return (
    <div
      className={cn(
        "rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/8 via-primary/5 to-transparent p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{resolvedTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{resolvedSubtitle}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onStart}
        className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {buttonLabel}
      </button>
      {!isSignedIn ? (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {t("conversion.deferred.footer", {
            defaultValue: "Browser merge & compress stay free — no account needed.",
          })}
        </p>
      ) : null}
    </div>
  );
}

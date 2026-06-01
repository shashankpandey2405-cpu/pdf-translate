"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/context/PremiumContext";
import { cn } from "@/lib/utils";

const LOCK_MS = 600;

type Props = {
  /** When false, children render immediately with no lock. */
  active?: boolean;
  className?: string;
  children: (revealed: boolean) => ReactNode;
};

/**
 * Brief "preparing download" moment for guests after a result appears (Phase 3 progress lock).
 * Signed-in users and reduced-motion preferences skip the delay.
 */
export function ResultReadyReveal({ active = true, className, children }: Props) {
  const { isSignedIn } = usePremium();
  const reduceMotion = useReducedMotion();
  const skipLock = !active || isSignedIn || !!reduceMotion;
  const [revealed, setRevealed] = useState(skipLock);

  useEffect(() => {
    if (skipLock) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    const t = window.setTimeout(() => setRevealed(true), LOCK_MS);
    return () => window.clearTimeout(t);
  }, [skipLock, active]);

  return <div className={className}>{children(revealed)}</div>;
}

type LockBannerProps = {
  className?: string;
};

/** Inline banner shown while the result lock is active. */
export function ResultReadyLockBanner({ className }: LockBannerProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        "rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 via-indigo-500/5 to-transparent p-4",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t("conversion.resultLock.title", { defaultValue: "Preparing your secure download…" })}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("conversion.resultLock.subtitle", {
              defaultValue: "Optimizing output · Your file stays private on this device",
            })}
          </p>
        </div>
      </div>
      <ol className="mt-3 flex items-center gap-2 text-[10px] font-medium text-muted-foreground" aria-hidden>
        <li className="flex items-center gap-1 text-primary">
          <CheckCircle2 className="h-3 w-3" />
          {t("conversion.resultLock.stepDone", { defaultValue: "Processed" })}
        </li>
        <span className="text-border">→</span>
        <li className="flex items-center gap-1 text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("conversion.resultLock.stepPrep", { defaultValue: "Packaging" })}
        </li>
        <span className="text-border">→</span>
        <li className="flex items-center gap-1 opacity-60">
          <ShieldCheck className="h-3 w-3" />
          {t("conversion.resultLock.stepReady", { defaultValue: "Ready" })}
        </li>
      </ol>
    </motion.div>
  );
}

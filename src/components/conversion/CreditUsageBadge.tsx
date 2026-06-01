"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/context/PremiumContext";

type BalanceSnapshot = {
  available: number;
  balance: number;
} | null;

/**
 * Shown after AI tool processing completes.
 * Fetches balance from /api/credits/balance and displays a concise usage line.
 * For guests it nudges toward sign-in.
 */
export function CreditUsageBadge({ creditsUsed }: { creditsUsed?: number }) {
  const { t } = useTranslation();
  const { isSignedIn } = usePremium();
  const [snap, setSnap] = useState<BalanceSnapshot>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/credits/balance", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.credits) {
          setSnap({ available: data.credits.available ?? 0, balance: data.credits.balance ?? 0 });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  if (!creditsUsed || creditsUsed <= 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
      <Sparkles className="h-3 w-3" aria-hidden />
      <span>
        {creditsUsed === 1
          ? t("conversion.creditsUsed", { defaultValue: "1 credit used", count: 1 })
          : t("conversion.creditsUsed_plural", {
              defaultValue: "{{count}} credits used",
              count: creditsUsed,
            })}
      </span>
      {isSignedIn && snap ? (
        <span className="text-muted-foreground">
          &middot;{" "}
          {t("conversion.creditsRemaining", {
            defaultValue: "{{count}} remaining",
            count: snap.available,
          })}
        </span>
      ) : !isSignedIn ? (
        <span className="text-muted-foreground">
          &middot;{" "}
          {t("conversion.creditsSignIn", {
            defaultValue: "Continue with Google for 10 credits/month",
          })}
        </span>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePremium } from "@/context/PremiumContext";
import { SESSION_CHANGED_EVENT } from "@/lib/authSession";
import {
  canPurchaseExtraCredits,
  shouldShowExtraCreditsPurchase,
} from "@/lib/billing/extraCreditsPolicy";

export type BillingState = {
  loading: boolean;
  isPremium: boolean;
  availableCredits: number;
  canPurchaseExtraCredits: boolean;
  showExtraCreditsPurchase: boolean;
  refresh: () => Promise<void>;
};

export function useBillingState(): BillingState {
  const { isSignedIn, isPremium: sessionPremium, sessionStatus } = usePremium();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(sessionPremium);
  const [availableCredits, setAvailableCredits] = useState(0);

  const refresh = useCallback(async () => {
    if (!isSignedIn || sessionStatus === "loading") {
      setIsPremium(sessionPremium);
      setAvailableCredits(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/credits/balance", { credentials: "include" });
      if (!res.ok) throw new Error("balance_fetch_failed");
      const data = (await res.json()) as {
        isPremium?: boolean;
        credits?: { available?: number };
      };
      setIsPremium(Boolean(data.isPremium));
      setAvailableCredits(data.credits?.available ?? 0);
    } catch {
      setIsPremium(sessionPremium);
      setAvailableCredits(0);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, sessionPremium, sessionStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onSession = () => void refresh();
    window.addEventListener(SESSION_CHANGED_EVENT, onSession);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onSession);
  }, [refresh]);

  const premium = isSignedIn ? isPremium : false;
  const available = isSignedIn ? availableCredits : 0;

  return {
    loading,
    isPremium: premium,
    availableCredits: available,
    canPurchaseExtraCredits: canPurchaseExtraCredits(premium),
    showExtraCreditsPurchase: shouldShowExtraCreditsPurchase(premium, available),
    refresh,
  };
}

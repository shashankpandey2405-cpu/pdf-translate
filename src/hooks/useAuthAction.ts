"use client";

import { useCallback } from "react";
import { useLocation } from "wouter";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import type { AuthIntent } from "@/context/AuthPromptContext";
import { fetchSession } from "@/lib/authSession";
import {
  PRICING_PATH,
  navigateToPricingIfNeeded,
  requestUpgradeAfterLimit,
} from "@/lib/billing/upgradeFlow";

/** Resolves auth from context + Supabase/API before showing sign-in or pricing. */
export function useAuthAction() {
  const { isSignedIn, sessionStatus, sessionUser, refreshSession } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const [, navigate] = useLocation();

  const resolveSignedIn = useCallback(async (): Promise<boolean> => {
    if (isSignedIn || sessionUser) return true;
    if (sessionStatus === "loading") {
      await refreshSession({ background: false });
    }
    try {
      const data = await fetchSession();
      return Boolean(data.user);
    } catch {
      return false;
    }
  }, [isSignedIn, sessionUser, sessionStatus, refreshSession]);

  const goToPricing = useCallback(() => {
    navigateToPricingIfNeeded(navigate);
  }, [navigate]);

  const requireSignIn = useCallback(
    async (intent?: AuthIntent): Promise<boolean> => {
      if (await resolveSignedIn()) return true;
      requestSignIn(intent);
      return false;
    },
    [resolveSignedIn, requestSignIn],
  );

  const requirePremiumUpgrade = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (await resolveSignedIn()) {
        goToPricing();
        return true;
      }
      requestUpgradeAfterLimit({
        isSignedIn: false,
        requestSignIn,
        navigate,
        reason,
      });
      return false;
    },
    [resolveSignedIn, goToPricing, requestSignIn, navigate],
  );

  return {
    resolveSignedIn,
    requireSignIn,
    requirePremiumUpgrade,
    goToPricing,
    requestUpgradeAfterLimit: (reason?: string) =>
      requestUpgradeAfterLimit({
        isSignedIn: isSignedIn || Boolean(sessionUser),
        requestSignIn,
        navigate,
        reason,
      }),
  };
}

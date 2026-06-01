"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import { useAuthAction } from "@/hooks/useAuthAction";
import { navigateToPricingIfNeeded } from "@/lib/billing/upgradeFlow";

type PremiumUpsellContextValue = {
  open: boolean;
  openPremium: () => void;
  closePremium: () => void;
};

const PremiumUpsellContext = createContext<PremiumUpsellContextValue | null>(null);

export function PremiumUpsellProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { resolveSignedIn, requirePremiumUpgrade } = useAuthAction();

  const openPremium = useCallback(() => {
    void (async () => {
      if (await resolveSignedIn()) {
        setOpen(false);
        navigateToPricingIfNeeded(navigate);
        return;
      }
      setOpen(true);
      await requirePremiumUpgrade("Sign in to view Premium plans and upgrade.");
    })();
  }, [navigate, requirePremiumUpgrade, resolveSignedIn]);

  const closePremium = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openPremium, closePremium }),
    [open, openPremium, closePremium],
  );

  return <PremiumUpsellContext.Provider value={value}>{children}</PremiumUpsellContext.Provider>;
}

export function usePremiumUpsell(): PremiumUpsellContextValue {
  const ctx = useContext(PremiumUpsellContext);
  if (!ctx) {
    return {
      open: false,
      openPremium: () => {},
      closePremium: () => {},
    };
  }
  return ctx;
}

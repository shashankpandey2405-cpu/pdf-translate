"use client";

import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePremium } from "@/context/PremiumContext";
import { isAuthEnabled } from "@/lib/featureFlags";

/** Refetches session when SPA route changes (PremiumProvider sits outside Wouter). */
export function AuthSessionSync() {
  const [location] = useLocation();
  const { refreshSession } = usePremium();

  useEffect(() => {
    if (!isAuthEnabled()) return;
    void refreshSession({ background: true });
  }, [location, refreshSession]);

  return null;
}

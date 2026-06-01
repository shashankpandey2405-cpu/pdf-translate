"use client";

import { useCallback } from "react";
import { useLocation } from "wouter";

/**
 * Navigates back within the app when possible; otherwise goes to home or all-tools.
 */
export function useSafeAppBack(fallback = "/") {
  const [, navigate] = useLocation();

  return useCallback(() => {
    if (typeof window === "undefined") {
      navigate(fallback);
      return;
    }

    const sameOriginReferrer =
      document.referrer &&
      (() => {
        try {
          return new URL(document.referrer).origin === window.location.origin;
        } catch {
          return false;
        }
      })();

    if (window.history.length > 1 && sameOriginReferrer) {
      window.history.back();
      return;
    }

    navigate(fallback);
  }, [navigate, fallback]);
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  clearPremiumFlow,
  PREMIUM_FLOW_RESTORE_EVENT,
  type PremiumFlowRestoreDetail,
} from "@/lib/auth/premiumFlowRestore";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";

export function usePremiumFlowRestore(
  toolSlug: string,
  onRestore: (flow: PremiumFlowRestoreDetail) => void | Promise<void>,
  opts?: { onAutoStart?: () => void | Promise<void> },
) {
  const { setMode } = useProcessingMode();
  usePremium();
  const onRestoreRef = useRef(onRestore);
  const onAutoStartRef = useRef(opts?.onAutoStart);
  onRestoreRef.current = onRestore;
  onAutoStartRef.current = opts?.onAutoStart;

  const applyRestore = useCallback(
    async (detail: PremiumFlowRestoreDetail) => {
      setMode(detail.mode === "enhanced" ? "enhanced" : "browser");
      await onRestoreRef.current(detail);
      if (detail.autoStart && detail.mode === "enhanced") {
        await onAutoStartRef.current?.();
      }
      await clearPremiumFlow();
    },
    [setMode],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PremiumFlowRestoreDetail>).detail;
      if (!detail || detail.toolSlug !== toolSlug) return;
      void applyRestore(detail);
    };
    window.addEventListener(PREMIUM_FLOW_RESTORE_EVENT, handler);
    return () => window.removeEventListener(PREMIUM_FLOW_RESTORE_EVENT, handler);
  }, [toolSlug, applyRestore]);

}

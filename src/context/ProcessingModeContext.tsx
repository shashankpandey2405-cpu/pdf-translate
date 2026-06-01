"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProcessingMode } from "@/lib/enhanced/types";
import { fetchEnhancedUsage } from "@/lib/enhanced/enhancedJobClient";
import type { EnhancedUsageResponse } from "@/lib/enhanced/types";
import { isEnhancedProcessingEnabled } from "@/lib/featureFlags";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { useCloudInfraStatus } from "@/hooks/useCloudInfraStatus";
import { usePremium } from "@/context/PremiumContext";
import { useAuthAction } from "@/hooks/useAuthAction";
import { isCloudOnlyToolPath, toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";
import { SESSION_CHANGED_EVENT } from "@/lib/authSession";
import { trackInteraction } from "@/utils/logger";
import { isClientQaModeActive } from "@/lib/qa/isQaMode";
import { openToolRightSlide } from "@/lib/limits/toolRightSlideBridge";

type ProcessingModeContextValue = {
  enabled: boolean;
  cloudInfraReady: boolean;
  cloudInfraMessage: string | null;
  cloudInfraLoading: boolean;
  mode: ProcessingMode;
  setMode: (mode: ProcessingMode) => void;
  usage: EnhancedUsageResponse | null;
  refreshUsage: () => Promise<void>;
};

const ProcessingModeContext = createContext<ProcessingModeContextValue | null>(null);

export function ProcessingModeProvider({ children }: { children: ReactNode }) {
  const flagEnabled = isEnhancedProcessingEnabled();
  const infra = useCloudInfraStatus();
  const enabled = flagEnabled || infra.ready;
  const [mode, setModeState] = useState<ProcessingMode>("browser");
  const [usage, setUsage] = useState<EnhancedUsageResponse | null>(null);
  const { isSignedIn, sessionStatus, refreshSession } = usePremium();
  const { resolveSignedIn, requireSignIn, requestUpgradeAfterLimit } = useAuthAction();

  const refreshUsage = useCallback(async () => {
    if (!enabled || sessionStatus === "loading" || !isSignedIn) {
      setUsage(null);
      return;
    }
    try {
      const snap = await fetchEnhancedUsage();
      setUsage(snap);
    } catch {
      setUsage({ enabled: false, enhancedRemaining: 0, dailyLimit: 2 });
    }
  }, [enabled, isSignedIn, sessionStatus]);

  useEffect(() => {
    void refreshUsage();
  }, [refreshUsage]);

  useEffect(() => {
    const onSession = () => void refreshUsage();
    window.addEventListener(SESSION_CHANGED_EVENT, onSession);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onSession);
  }, [refreshUsage]);

  const qaMode = isClientQaModeActive();
  const creditsReserved = usage?.credits?.reserved ?? 0;
  const premiumExhausted =
    !qaMode &&
    usage?.enabled &&
    usage.enhancedRemaining !== undefined &&
    usage.enhancedRemaining <= 0 &&
    creditsReserved <= 0;

  useEffect(() => {
    if (premiumExhausted && mode === "enhanced") {
      const onCloudOnlyRoute =
        typeof window !== "undefined" && isCloudOnlyToolPath(window.location.pathname);
      if (!onCloudOnlyRoute) {
        setModeState("browser");
      }
    }
  }, [premiumExhausted, mode]);

  const setMode = useCallback(
    (next: ProcessingMode) => {
      if (next === "enhanced") {
        if (!enabled) return;
        void (async () => {
          const signedIn = await resolveSignedIn();
          if (!signedIn) {
            await requireSignIn({
              reason: SIGN_IN_REASON.cloudTurbo,
              tone: "cloud",
              deferredAction: "premium-restore",
            });
            return;
          }
          if (premiumExhausted) {
            requestUpgradeAfterLimit("Upgrade to Premium to continue with cloud processing.");
            return;
          }
          trackInteraction("processing_mode_selected", { mode: next });
          setModeState(next);
        })();
        return;
      }
      trackInteraction("processing_mode_selected", { mode: next });
      setModeState(next);
    },
    [enabled, resolveSignedIn, requireSignIn, premiumExhausted, requestUpgradeAfterLimit],
  );

  const value = useMemo(
    () => ({
      enabled,
      cloudInfraReady: infra.ready,
      cloudInfraMessage: infra.message,
      cloudInfraLoading: infra.loading,
      mode,
      setMode,
      usage,
      refreshUsage,
    }),
    [enabled, infra.ready, infra.message, infra.loading, mode, setMode, usage, refreshUsage],
  );

  return <ProcessingModeContext.Provider value={value}>{children}</ProcessingModeContext.Provider>;
}

/** Resets enhanced mode when navigating to tools without cloud workers. */
export function ProcessingModeScope({ toolSlug, children }: { toolSlug: string; children: ReactNode }) {
  const { setMode, mode } = useProcessingMode();

  useEffect(() => {
    if (!toolSupportsCloudProcessing(toolSlug) && mode === "enhanced") {
      setMode("browser");
    }
  }, [toolSlug, mode, setMode]);

  return <>{children}</>;
}

export function useProcessingMode() {
  const ctx = useContext(ProcessingModeContext);
  if (!ctx) {
    return {
      enabled: false,
      cloudInfraReady: false,
      cloudInfraMessage: null,
      cloudInfraLoading: false,
      mode: "browser" as ProcessingMode,
      setMode: () => {},
      usage: null,
      refreshUsage: async () => {},
    };
  }
  return ctx;
}

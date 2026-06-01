"use client";

import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import {
  getCloudExecutionState,
  getToolProfile,
  requiresCloudOnlyProcessing,
} from "@/lib/processing/toolProfiles";
import { getBrowserEngineLabel, getCloudEngineLabel } from "@/lib/processing/engineMatrix";
import { Cloud, Lock, Shield, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { stashAuthIntent } from "@/context/AuthPromptContext";
import { isClientQaModeActive } from "@/lib/qa/isQaMode";
import { requestUpgradeAfterLimit } from "@/lib/billing/upgradeFlow";
import { suggestProcessingMode } from "@/lib/limits/suggestProcessingMode";
import { useProcessingMonitor } from "@/context/ProcessingMonitorContext";
import { ProcessingMonitorDrawer } from "@/components/processing/ProcessingMonitorDrawer";

type Props = {
  toolSlug: string;
  file?: File | null;
  settings?: Record<string, unknown>;
  className?: string;
  showCancel?: boolean;
  /** When set, browser mode is disabled with this explanation (e.g. scanned PDF). */
  browserDisabledReason?: string | null;
  onCancel?: () => void;
  onRunPremium?: () => void | Promise<void>;
  onRunNormal?: () => void | Promise<void>;
  /** Sidebar panel: stacked compact cards without page title. */
  variant?: "default" | "sidebar";
  /** Set mode only; run via sticky CTA (gear sheet). */
  pickOnly?: boolean;
};

const cardBaseDefault =
  "relative flex w-full flex-col gap-3 rounded-2xl border p-6 text-left transition-all touch-manipulation min-h-[min(44px,100%)] min-h-[160px]";
const cardBaseSidebar =
  "relative flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-all touch-manipulation";

export function ExecutionModeSelector({
  toolSlug,
  file,
  settings,
  className,
  showCancel = true,
  browserDisabledReason = null,
  onCancel,
  onRunPremium,
  onRunNormal,
  variant = "default",
  pickOnly = false,
}: Props) {
  const { t } = useTranslation();
  const { enabled, mode, setMode, usage } = useProcessingMode();
  const { isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const { setMonitor } = useProcessingMonitor();
  const [, navigate] = useLocation();
  const profile = getToolProfile(toolSlug);
  const cloudState = getCloudExecutionState(toolSlug);
  const cloudOnly = requiresCloudOnlyProcessing(toolSlug);
  const qaMode = isClientQaModeActive();
  const creditsReserved = usage?.credits?.reserved ?? 0;
  const premiumQuotaExhausted =
    !qaMode &&
    usage?.enabled &&
    usage.enhancedRemaining !== undefined &&
    usage.enhancedRemaining <= 0 &&
    creditsReserved <= 0;
  const cloudActive = cloudState === "active";
  const cloudComingSoon = cloudState === "comingSoon";
  const premiumBlocked =
    cloudActive && isSignedIn && premiumQuotaExhausted;

  if (!enabled) return null;

  const handlePremium = async () => {
    if (cloudComingSoon || !cloudActive) return;
    if (!isSignedIn) {
      if (file) {
        const stashed = await stashPremiumFlow({
          blob: file,
          fileName: file.name,
          mimeType: file.type,
          toolSlug,
          mode: "enhanced",
          settings,
        });
        if (!stashed) {
          toast.error(t("execution.stashFailed"));
          return;
        }
      }
      stashAuthIntent({
        returnPath: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
        desiredMode: "enhanced",
        toolSlug,
        autoStart: Boolean(file),
        deferredAction: "premium-restore",
        reason: t("execution.cloudSignInReason"),
        tone: "cloud",
      });
      requestSignIn({
        reason: t("execution.cloudSignInReason"),
        tone: "cloud",
        deferredAction: "premium-restore",
        toolSlug,
      });
      return;
    }
    if (premiumQuotaExhausted) {
      requestUpgradeAfterLimit({
        isSignedIn,
        requestSignIn,
        navigate,
        reason: t("execution.upgradeRequired"),
      });
      return;
    }
    setMode("enhanced");
    if (!pickOnly) await onRunPremium?.();
  };

  const handleNormal = async () => {
    setMode("browser");
    if (!pickOnly) await onRunNormal?.();
  };

  const cardBase = variant === "sidebar" ? cardBaseSidebar : cardBaseDefault;
  const isSidebar = variant === "sidebar";
  const browserEngine = getBrowserEngineLabel(toolSlug);
  const cloudEngine = getCloudEngineLabel(toolSlug);

  const suggestion = useMemo(() => {
    if (!file) return null;
    return suggestProcessingMode({ slug: toolSlug, file, isSignedIn });
  }, [file, toolSlug, isSignedIn]);

  useEffect(() => {
    if (!file) {
      setMonitor({ active: false, mode: "idle", fileName: undefined, fileSizeBytes: undefined });
      return;
    }
    setMonitor({
      active: true,
      mode: mode === "enhanced" ? "enhanced" : "browser",
      fileName: file.name,
      fileSizeBytes: file.size,
      ...(mode === "browser" ? { networkUploads: 0 } : {}),
    });
  }, [file, mode, setMonitor]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      {!isSidebar ? (
        <p className="mb-3 text-sm font-semibold text-foreground">
          {t("execution.modeTitle", {
            defaultValue: "Private when you need it · Powerful when you don't",
          })}
        </p>
      ) : null}

      {suggestion && file ? (
        <p
          className={cn(
            "mb-3 rounded-xl border px-3 py-2.5 text-xs",
            suggestion.recommended === "enhanced"
              ? "border-indigo-400/40 bg-indigo-500/5 text-indigo-900 dark:text-indigo-200"
              : "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground",
          )}
        >
          {t(suggestion.reasonKey, { defaultValue: suggestion.reasonDefault })}
        </p>
      ) : null}

      <ProcessingMonitorDrawer className="mb-4" />

      {mode === "enhanced" && cloudActive && isSignedIn ? (
        <p className="mb-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          {t("execution.cloudSelectedHint")}
        </p>
      ) : null}

      <div className={cn("grid gap-3", !cloudOnly && !isSidebar ? "md:grid-cols-2" : "grid-cols-1")}>
        {!cloudOnly ? (
          <button
            type="button"
            onClick={() => void handleNormal()}
            disabled={Boolean(browserDisabledReason)}
            className={cn(
              cardBase,
              browserDisabledReason
                ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
                : "border-border bg-card hover:border-foreground/20 hover:shadow-md",
            )}
          >
            <span className={cn("flex items-center gap-2 font-bold text-foreground", isSidebar ? "text-sm" : "text-lg")}>
              <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
              {t("execution.browserTitle", { defaultValue: "Private Local" })}
            </span>
            <span className={cn("text-muted-foreground", isSidebar ? "text-xs" : "text-sm")}>
              {t("execution.browserDesc", {
                defaultValue: "Free · Zero upload · Stays on this device",
              })}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {browserDisabledReason
                ? browserDisabledReason
                : t("execution.browserLimits", { mb: profile.normalMaxFileMB })}
            </span>
            {browserEngine && !browserDisabledReason ? (
              <span className="text-[11px] text-muted-foreground/90">Engine: {browserEngine}</span>
            ) : null}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => void handlePremium()}
          disabled={cloudComingSoon || (premiumBlocked && cloudActive)}
          className={cn(
            cardBase,
            cloudComingSoon && "cursor-not-allowed opacity-70 border-border bg-muted/30",
            premiumBlocked && cloudActive && "cursor-not-allowed opacity-60",
            cloudActive &&
              !premiumBlocked &&
              !cloudComingSoon &&
              "border-primary/40 ring-1 ring-primary/15 hover:border-primary hover:shadow-md",
          )}
        >
          <span
            className={cn(
              "flex flex-wrap items-center gap-2 font-bold text-foreground",
              isSidebar ? "text-sm" : "text-lg",
            )}
          >
            {!cloudActive || !isSignedIn ? (
              <Lock className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
            )}
            <Cloud className="h-4 w-4 text-indigo-600 shrink-0" />
            {t("execution.cloudTitle", { defaultValue: "Turbo Cloud" })}
            {cloudComingSoon ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-200">
                {t("execution.comingSoon")}
              </span>
            ) : null}
          </span>
          <span className={cn("text-muted-foreground", isSidebar ? "text-xs" : "text-sm")}>
            {cloudComingSoon
              ? t("execution.cloudComingSoonDesc")
              : t("execution.cloudDesc", {
                  defaultValue: "Faster · Heavy files · AI OCR · Auto-delete after processing",
                })}
          </span>
          {!cloudComingSoon ? (
            <>
              <span className="text-xs font-medium text-primary">
                {!isSignedIn
                  ? t("execution.cloudSignInCta", {
                      defaultValue: "Sign in · 10 credits/month for cloud + AI",
                    })
                  : premiumQuotaExhausted
                    ? t("execution.upgradeRequired")
                    : usage?.enhancedRemaining !== undefined
                      ? t("execution.cloudRemaining", {
                          defaultValue: "{{count}} credits left this month",
                          count: usage.enhancedRemaining,
                        })
                      : t("execution.cloudSignInCta", {
                          defaultValue: "Sign in · 10 credits/month for cloud + AI",
                        })}
              </span>
              {cloudEngine ? (
                <span className="text-[11px] text-muted-foreground/90">Engine: {cloudEngine}</span>
              ) : null}
            </>
          ) : null}
        </button>

        {showCancel && onCancel && !isSidebar ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] w-full rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <X className="h-4 w-4" />
              {t("execution.cancel")}
            </span>
          </button>
        ) : null}
      </div>
    </motion.section>
  );
}

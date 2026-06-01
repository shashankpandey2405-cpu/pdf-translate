"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { usePerceivedCloudProgress } from "@/hooks/usePerceivedCloudProgress";
import type { EnhancedJobResponse } from "@/lib/enhanced/types";

const STEP_KEYS = [
  "cloudProgress.uploading",
  "cloudProgress.preparing",
  "cloudProgress.analyzing",
  "cloudProgress.processing",
  "cloudProgress.optimizing",
  "cloudProgress.reconstructing",
  "cloudProgress.rendering",
  "cloudProgress.finalizing",
] as const;

type Props = {
  cloudStatus: EnhancedJobResponse["status"] | "idle" | "downloading";
  backendProgress: number;
  active: boolean;
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
};

/** One premium step at a time — cloud-fast progress bar with shimmer. */
export function CloudProcessingExperience({
  cloudStatus,
  backendProgress,
  active,
  error,
  onCancel,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  const { displayProgress, stepIndex } = usePerceivedCloudProgress({
    backendProgress,
    cloudStatus,
    active,
  });

  if (!active && cloudStatus === "idle") return null;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4"
      >
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex flex-wrap gap-2">
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("tools.tryAgain", { defaultValue: "Try again" })}
            </Button>
          ) : null}
          {onCancel ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t("cloudProgress.cancel")}
            </Button>
          ) : null}
        </div>
      </motion.div>
    );
  }

  const titleKey = STEP_KEYS[Math.min(stepIndex, STEP_KEYS.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-10 sm:py-14"
      aria-live="polite"
      aria-busy={cloudStatus !== "done" && cloudStatus !== "downloading"}
    >
      <ProcessingStatus
        type="cloud"
        progress={displayProgress}
        label={
          cloudStatus === "downloading"
            ? t("cloudProgress.downloading", { defaultValue: "Preparing your download…" })
            : t(titleKey)
        }
      />

      <ol className="mt-6 flex flex-wrap items-center justify-center gap-1.5 px-4" aria-hidden>
        {STEP_KEYS.map((key, i) => (
          <li
            key={key}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i <= stepIndex ? "w-6 bg-indigo-600" : "w-3 bg-muted",
            )}
          />
        ))}
      </ol>
      <p className="mt-3 max-w-sm text-center text-xs text-muted-foreground">
        {t("cloudProgress.subtitle")}
      </p>

      {onCancel && cloudStatus !== "done" && cloudStatus !== "downloading" ? (
        <Button type="button" variant="ghost" size="sm" className="mt-6" onClick={onCancel}>
          {t("cloudProgress.cancel")}
        </Button>
      ) : null}
    </motion.div>
  );
}

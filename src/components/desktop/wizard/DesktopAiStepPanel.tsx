"use client";

import { useState } from "react";
import { Cloud, Cpu, Shield, Sparkles } from "lucide-react";
import { DesktopStepRow } from "@/components/desktop/wizard/DesktopStepRow";
import { MasterToolProgressCard } from "@/components/desktop/master/MasterToolActionCards";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import type { AiDocumentProcessingMode } from "@/lib/processing/aiCloudOptions";
import { useToolRightRail } from "@/context/ToolRightRailContext";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useAiCreditEstimate } from "@/hooks/useAiCreditEstimate";
import { AiCreditEstimateCard } from "@/components/processing/AiCreditEstimateCard";

type Props = {
  toolSlug: string;
  file: File | null;
  toolLabel: string;
  isSignedIn: boolean;
  disabled?: boolean;
  isProcessing?: boolean;
  progress?: number;
  showBrowser?: boolean;
  aiTrialAvailable?: boolean;
  settings?: ReactNode;
  onRequestSignIn: () => void;
  onChoose: (mode: AiDocumentProcessingMode) => void | Promise<void>;
  /** Guest cloud/AI start — stash file + open sign-in (Phase 5 deferred). */
  onDeferredCloudStart?: (mode: AiDocumentProcessingMode) => void | Promise<void>;
};

export function DesktopAiStepPanel({
  toolSlug,
  file,
  toolLabel,
  isSignedIn,
  disabled,
  isProcessing,
  progress = 0,
  showBrowser = true,
  aiTrialAvailable = true,
  settings,
  onRequestSignIn,
  onChoose,
  onDeferredCloudStart,
}: Props) {
  const { validation, highlightValidation, clearValidation } = useToolRightRail();
  const [mode, setMode] = useState<AiDocumentProcessingMode>(
    showBrowser ? "browser" : "ai_plus",
  );

  const { estimate, loading: estimateLoading, error: estimateError } = useAiCreditEstimate(
    toolSlug,
    file,
    Boolean(file) && isSignedIn,
  );

  const aiPlusBlocked =
    isSignedIn &&
    !estimateLoading &&
    estimate != null &&
    !estimate.useTrial &&
    !estimate.canProceed;

  const aiPlusEnabled =
    !isSignedIn || aiTrialAvailable || estimate?.useTrial || estimate?.canProceed || estimateLoading;

  if (isProcessing) {
    return <MasterToolProgressCard progress={progress} label={`Processing ${toolLabel}`} />;
  }

  const needsSignIn = mode !== "browser" && !isSignedIn;

  const run = () => {
    if (!file) {
      highlightValidation({ run: true });
      return;
    }
    if (needsSignIn) {
      highlightValidation({ account: true });
      onRequestSignIn();
      return;
    }
    if (mode === "ai_plus" && aiPlusBlocked) {
      highlightValidation({ options: true });
      return;
    }
    clearValidation();
    void onChoose(mode);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-bold text-foreground">{toolLabel}</p>

      <div
        className={cn(
          "rounded-xl border bg-white p-3 shadow-sm",
          validation.processing ? "border-destructive ring-2 ring-destructive/25" : "border-border/80",
        )}
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Processing</p>
        <div className="space-y-2">
          {showBrowser ? (
            <DesktopStepRow
              icon={Shield}
              title="Browser — extract text"
              subtitle="Local only, no cloud upload."
              selected={mode === "browser"}
              disabled={disabled}
              onClick={() => setMode("browser")}
            />
          ) : null}
          <DesktopStepRow
            icon={Cloud}
            title="Trusted Cloud + OCR"
            subtitle="Searchable PDF via cloud OCR."
            selected={mode === "ocr_cloud"}
            disabled={disabled}
            onClick={() => setMode("ocr_cloud")}
          />
          <DesktopStepRow
            icon={Sparkles}
            title="AI Plus"
            subtitle="OpenRouter on secure cloud · trial or credits"
            badge="AI"
            selected={mode === "ai_plus"}
            disabled={disabled || !aiPlusEnabled}
            onClick={() => setMode("ai_plus")}
          />
        </div>
      </div>

      {isSignedIn && file && mode === "ai_plus" ? (
        <AiCreditEstimateCard estimate={estimate} loading={estimateLoading} error={estimateError} />
      ) : null}

      {settings ? (
        <div
          className={cn(
            "rounded-xl border bg-white p-3 shadow-sm",
            validation.options ? "border-destructive ring-2 ring-destructive/25" : "border-border/80",
          )}
        >
          {settings}
          {validation.options ? (
            <p className="mt-2 text-xs font-medium text-destructive">Adjust AI settings above.</p>
          ) : null}
        </div>
      ) : null}

      {needsSignIn ? (
        <div
          className={cn(
            validation.account ? "rounded-xl ring-2 ring-destructive/25" : "",
          )}
        >
        <DeferredStartPanel
          variant={mode === "ai_plus" ? "ai" : "cloud"}
          onStart={() => {
            if (onDeferredCloudStart) {
              void onDeferredCloudStart(mode);
            } else {
              onRequestSignIn();
            }
          }}
          disabled={disabled}
          isSignedIn={false}
        />
        </div>
      ) : (
        <div
          className={cn(
            validation.run ? "rounded-xl ring-2 ring-destructive/25 p-0.5" : "",
          )}
        >
        <button
          type="button"
          disabled={disabled}
          onClick={run}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md",
            disabled ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90",
          )}
        >
          <Sparkles className="h-4 w-4" />
          Run {toolLabel}
        </button>
        </div>
      )}

      <p className="flex items-start gap-2 text-[10px] text-muted-foreground">
        <Cpu className="mt-0.5 h-3 w-3 shrink-0" />
        Cloud and AI jobs run on secure Railway workers with automatic cleanup.
      </p>
    </div>
  );
}

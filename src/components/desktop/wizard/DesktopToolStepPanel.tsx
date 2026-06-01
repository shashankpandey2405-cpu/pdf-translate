"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Cloud, Monitor, ScanLine, Sparkles, UserCheck } from "lucide-react";
import { DesktopStepRow } from "@/components/desktop/wizard/DesktopStepRow";
import { MasterToolProgressCard } from "@/components/desktop/master/MasterToolActionCards";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import {
  getDefaultProcessingPaths,
  pathRequiresSignIn,
  type ProcessingPathId,
} from "@/lib/desktop/processingPaths";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import {
  CompressionLevel,
  getQualityDescription,
  getQualityLabel,
} from "@/tools/compress-pdf/logic";
import { useToolRightRail } from "@/context/ToolRightRailContext";
import { cn } from "@/lib/utils";

type Props = {
  toolSlug: string;
  isSignedIn: boolean;
  disabled?: boolean;
  browserDisabledReason?: string | null;
  showBrowser?: boolean;
  compressionLevel?: CompressionLevel;
  onCompressionLevelChange?: (level: CompressionLevel) => void;
  extraOptions?: ReactNode;
  processLabel?: string;
  panelTitle?: string;
  isProcessing?: boolean;
  progress?: number;
  onRequestSignIn: () => void;
  /** Guest cloud start — stash file + open sign-in (deferred signup). */
  onDeferredCloudStart?: (tier: PremiumProcessingTier) => void | Promise<void>;
  onProcess: (selection: {
    path: ProcessingPathId;
    tier: PremiumProcessingTier;
    mode: "browser" | "enhanced";
  }) => void;
};

const COMPRESS_LEVELS: CompressionLevel[] = ["extreme", "recommended", "less"];

function DesktopStepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
        {step}
      </span>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  );
}

export function DesktopToolStepPanel({
  toolSlug,
  isSignedIn,
  disabled,
  browserDisabledReason,
  showBrowser = true,
  compressionLevel,
  onCompressionLevelChange,
  extraOptions,
  processLabel = "Process document",
  panelTitle = "Settings",
  isProcessing,
  progress = 0,
  onRequestSignIn,
  onDeferredCloudStart,
  onProcess,
}: Props) {
  const { validation, highlightValidation, clearValidation } = useToolRightRail();
  const paths = useMemo(
    () =>
      getDefaultProcessingPaths(toolSlug, { browserDisabledReason }).filter(
        (p) => showBrowser || p.id !== "browser",
      ),
    [toolSlug, browserDisabledReason, showBrowser],
  );

  const [selectedPath, setSelectedPath] = useState<ProcessingPathId | null>(null);

  useEffect(() => {
    if (paths.length && !selectedPath) setSelectedPath(paths[0]!.id);
  }, [paths, selectedPath]);

  const activePath = paths.find((p) => p.id === selectedPath) ?? paths[0] ?? null;
  const needsSignIn = activePath ? pathRequiresSignIn(activePath.id) && !isSignedIn : false;
  const showCompressOptions = toolSlug === "compress-pdf" && compressionLevel && onCompressionLevelChange;
  const showToolOptions = Boolean(showCompressOptions || extraOptions);

  const stepProcess = showToolOptions ? (needsSignIn ? 4 : 3) : needsSignIn ? 3 : 2;
  const stepOptions = 2;
  const stepAccount = showToolOptions ? 3 : 2;

  const canProcess =
    activePath &&
    !disabled &&
    !isProcessing &&
    (!needsSignIn || isSignedIn) &&
    (!showCompressOptions || compressionLevel);

  const handleProcess = () => {
    if (!activePath) {
      highlightValidation({ processing: true });
      return;
    }
    if (showCompressOptions && !compressionLevel) {
      highlightValidation({ options: true });
      return;
    }
    if (needsSignIn) {
      highlightValidation({ account: true });
      onRequestSignIn();
      return;
    }
    clearValidation();
    onProcess({
      path: activePath.id,
      tier: activePath.tier,
      mode: activePath.mode,
    });
  };

  if (isProcessing) {
    return <MasterToolProgressCard progress={progress} label="Processing" />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-bold text-foreground">{panelTitle}</p>
      <div
        className={cn(
          "rounded-xl border bg-white p-3 shadow-sm transition-colors",
          validation.processing ? "border-destructive ring-2 ring-destructive/25" : "border-border/80",
        )}
      >
        <DesktopStepHeading step={1} title="Choose processing" />
        <div className="space-y-2">
          {paths.map((p) => {
            if (p.id === "browser") {
              return (
                <DesktopStepRow
                  key={p.id}
                  icon={Monitor}
                  title="Private Local — in browser"
                  subtitle="Zero upload, stays on this device. Best for everyday PDFs."
                  selected={selectedPath === p.id || (!selectedPath && paths[0]?.id === p.id)}
                  disabled={disabled}
                  onClick={() => setSelectedPath(p.id)}
                />
              );
            }
            if (p.id === "cloud-ocr") {
              return (
                <DesktopStepRow
                  key={p.id}
                  icon={ScanLine}
                  title="Trusted Cloud — with OCR"
                  subtitle="Scanned pages, tables, and layout-aware output."
                  badge="Premium"
                  selected={selectedPath === p.id}
                  disabled={disabled}
                  onClick={() => setSelectedPath(p.id)}
                />
              );
            }
            return (
              <DesktopStepRow
                key={p.id}
                icon={Cloud}
                title="Trusted Cloud — without OCR"
                subtitle="Higher quality cloud engine for digital PDFs."
                badge="Premium"
                selected={selectedPath === p.id || (!selectedPath && paths.length === 1)}
                disabled={disabled}
                onClick={() => setSelectedPath(p.id)}
              />
            );
          })}
        </div>
        {browserDisabledReason ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{browserDisabledReason}</p>
        ) : null}
        {validation.processing ? (
          <p className="mt-2 text-xs font-medium text-destructive">Select a processing mode above.</p>
        ) : null}
      </div>

      {showToolOptions ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl border bg-white p-3 shadow-sm",
            validation.options ? "border-destructive ring-2 ring-destructive/25" : "border-border/80",
          )}
        >
          <DesktopStepHeading step={stepOptions} title="Tool settings" />
          {showCompressOptions ? (
            <div className="space-y-2">
              {COMPRESS_LEVELS.map((l) => (
                <DesktopStepRow
                  key={l}
                  icon={Sparkles}
                  title={getQualityLabel(l)}
                  subtitle={getQualityDescription(
                    l,
                    activePath?.mode === "enhanced" ? "cloud" : "browser",
                  )}
                  selected={compressionLevel === l}
                  disabled={disabled}
                  onClick={() => onCompressionLevelChange!(l)}
                />
              ))}
            </div>
          ) : (
            extraOptions
          )}
          {validation.options ? (
            <p className="mt-2 text-xs font-medium text-destructive">Complete tool settings above.</p>
          ) : null}
        </motion.div>
      ) : null}

      {needsSignIn ? (
        <div
          className={cn(
            "rounded-xl border bg-white p-3 shadow-sm",
            validation.account ? "border-destructive ring-2 ring-destructive/25" : "border-border/80",
          )}
        >
          <DesktopStepHeading step={stepAccount} title="Your account" />
          <DeferredStartPanel
            variant="cloud"
            onStart={() => {
              if (onDeferredCloudStart && activePath) {
                void onDeferredCloudStart(activePath.tier);
              } else {
                onRequestSignIn();
              }
            }}
            disabled={disabled}
            isSignedIn={false}
          />
        </div>
      ) : activePath && pathRequiresSignIn(activePath.id) && isSignedIn ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-800">
          <UserCheck className="h-4 w-4 shrink-0" />
          <span>Signed in — ready for cloud processing</span>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-xl border bg-white p-3 shadow-sm",
          validation.run ? "border-destructive ring-2 ring-destructive/25" : "border-border/80",
        )}
      >
        <DesktopStepHeading step={stepProcess} title="Run" />
        <button
          type="button"
          onClick={handleProcess}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition",
            canProcess ? "bg-primary hover:bg-primary/90" : "bg-primary/90 hover:bg-primary",
          )}
        >
          {processLabel}
        </button>
        {!canProcess && !validation.processing && !validation.options ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Finish the steps above, then run</p>
        ) : null}
      </div>
    </div>
  );
}

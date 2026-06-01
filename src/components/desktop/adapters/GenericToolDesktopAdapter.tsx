"use client";

import { useMemo, useCallback, type ReactNode } from "react";
import { MasterToolWorkspace } from "@/components/desktop/master/MasterToolWorkspace";
import { MasterToolCenterPreview } from "@/components/desktop/master/MasterToolCenterPreview";
import { MasterToolDonePanel } from "@/components/desktop/master/MasterToolDonePanel";
import { DesktopToolStepPanel } from "@/components/desktop/wizard/DesktopToolStepPanel";
import { MasterToolProgressCard } from "@/components/desktop/master/MasterToolActionCards";
import { getToolDesktopMeta } from "@/lib/desktop/toolMeta";
import type { MasterToolStage } from "@/lib/desktop/types";
import type { ProcessingPathId } from "@/lib/desktop/processingPaths";
import type { EnhancedJobUiStatus } from "@/hooks/useEnhancedJob";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";

export type GenericToolDesktopProps = {
  toolSlug: string;
  stage: MasterToolStage;
  file: File | null;
  files?: File[];
  multiple?: boolean;
  accept?: string;
  progress: number;
  isEnhanced: boolean;
  cloudProgress: number;
  cloudStatus?: EnhancedJobUiStatus;
  errorMessage?: string | null;
  resultBlob: Blob | null;
  resultFilename: string;
  objectUrl: string | null;
  onFiles: (files: File[]) => void | Promise<void>;
  onProcessSelection: (selection: {
    path: ProcessingPathId;
    tier: "standard" | "pro";
    mode: "browser" | "enhanced";
  }) => void;
  browserDisabledReason?: string | null;
  enhancedUiEnabled: boolean;
  isSignedIn: boolean;
  onRequestSignIn: () => void;
  onDeferredCloudStart?: (tier: "standard" | "pro") => void | Promise<void>;
  onReset: () => void;
  onDownload?: () => void;
  showBrowser?: boolean;
  showPremium?: boolean;
  extraOptions?: ReactNode;
  processLabel?: string;
};

export function GenericToolDesktopAdapter({
  toolSlug,
  stage,
  file,
  files,
  multiple,
  accept,
  progress,
  isEnhanced,
  cloudProgress,
  cloudStatus = "idle",
  errorMessage,
  resultBlob,
  resultFilename,
  objectUrl,
  onFiles,
  onProcessSelection,
  browserDisabledReason,
  enhancedUiEnabled,
  isSignedIn,
  onRequestSignIn,
  onDeferredCloudStart,
  onReset,
  onDownload,
  showBrowser = true,
  showPremium = true,
  extraOptions,
  processLabel,
}: GenericToolDesktopProps) {
  const meta = getToolDesktopMeta(toolSlug);
  const useCloudProgress =
    isEnhanced ||
    cloudStatus === "queued" ||
    cloudStatus === "processing" ||
    cloudStatus === "downloading";
  const activeProgress = useCloudProgress ? cloudProgress : progress;
  const primaryFile = file ?? files?.[0] ?? null;

  const defaultDownload = useCallback(() => {
    if (!resultBlob) return;
    void safeDownloadBlob(resultBlob, resultFilename || "output");
  }, [resultBlob, resultFilename]);

  const defaultShare = useCallback(() => {
    if (!resultBlob) return;
    void shareBlob(resultBlob, resultFilename || "output");
  }, [resultBlob, resultFilename]);

  const centerPreview =
    primaryFile && stage !== "upload" ? (
      <MasterToolCenterPreview file={primaryFile} files={files} />
    ) : null;

  const rightPanel = useMemo(() => {
    if (stage === "done") {
      return (
        <MasterToolDonePanel
          title={meta.doneTitle}
          onDownload={onDownload ?? defaultDownload}
          onShare={defaultShare}
          onReset={onReset}
          nextActions={meta.nextActions}
        />
      );
    }
    if ((stage as string) === "processing") {
      return <MasterToolProgressCard progress={activeProgress} />;
    }
    return (
      <>
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/35 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        <DesktopToolStepPanel
        toolSlug={toolSlug}
        isSignedIn={isSignedIn}
        disabled={(stage as string) === "processing"}
        browserDisabledReason={browserDisabledReason}
        showBrowser={showBrowser}
        extraOptions={extraOptions}
        processLabel={processLabel ?? meta.freeActionLabel}
        panelTitle={meta.title}
        onRequestSignIn={onRequestSignIn}
        onDeferredCloudStart={onDeferredCloudStart}
        onProcess={onProcessSelection}
      />
      </>
    );
  }, [
    stage,
    meta,
    toolSlug,
    isSignedIn,
    activeProgress,
    browserDisabledReason,
    showBrowser,
    showPremium,
    extraOptions,
    processLabel,
    errorMessage,
    onDownload,
    defaultDownload,
    defaultShare,
    onReset,
    onRequestSignIn,
    onDeferredCloudStart,
    onProcessSelection,
  ]);

  return (
    <MasterToolWorkspace
      toolSlug={toolSlug}
      stage={stage}
      file={file}
      files={files}
      multiple={multiple}
      accept={accept}
      onFiles={onFiles}
      onReset={onReset}
      progress={activeProgress}
      configureContent={centerPreview}
      hideFileMetaBar
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={objectUrl}
      rightPanel={rightPanel}
    />
  );
}

"use client";

import { useMemo, useCallback } from "react";
import { CompressBeforeAfterPreview } from "@/components/desktop/compress/CompressBeforeAfterPreview";
import { MasterToolWorkspace } from "@/components/desktop/master/MasterToolWorkspace";
import { MasterToolCenterPreview } from "@/components/desktop/master/MasterToolCenterPreview";
import { MasterToolDonePanel } from "@/components/desktop/master/MasterToolDonePanel";
import { MasterToolProgressCard } from "@/components/desktop/master/MasterToolActionCards";
import { DesktopToolStepPanel } from "@/components/desktop/wizard/DesktopToolStepPanel";
import { getToolDesktopMeta } from "@/lib/desktop/toolMeta";
import type { MasterToolStage } from "@/lib/desktop/types";
import type { CompressionLevel } from "@/tools/compress-pdf/logic";
import type { ProcessingPathId } from "@/lib/desktop/processingPaths";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";

export type CompressDesktopProps = {
  stage: MasterToolStage;
  file: File | null;
  level: CompressionLevel;
  onLevelChange: (level: CompressionLevel) => void;
  progress: number;
  isEnhanced: boolean;
  cloudProgress: number;
  resultBlob: Blob | null;
  resultFilename: string;
  objectUrl: string | null;
  onFiles: (files: File[]) => void | Promise<void>;
  onBrowserCompress: () => void;
  onPremiumCompress: () => void;
  onOpenModeModal: () => void;
  enhancedUiEnabled: boolean;
  isSignedIn: boolean;
  onRequestSignIn: () => void;
  onReset: () => void;
  onDownload?: () => void;
};

export function CompressDesktopAdapter({
  stage,
  file,
  level,
  onLevelChange,
  progress,
  isEnhanced,
  cloudProgress,
  resultBlob,
  resultFilename,
  objectUrl,
  onFiles,
  onBrowserCompress,
  onPremiumCompress,
  onOpenModeModal,
  enhancedUiEnabled,
  isSignedIn,
  onRequestSignIn,
  onReset,
  onDownload,
}: CompressDesktopProps) {
  const meta = getToolDesktopMeta("compress-pdf");
  const activeProgress = isEnhanced ? cloudProgress : progress;

  const defaultDownload = useCallback(() => {
    if (!resultBlob) return;
    void safeDownloadBlob(resultBlob, resultFilename || "compressed.pdf");
  }, [resultBlob, resultFilename]);

  const defaultShare = useCallback(() => {
    if (!resultBlob) return;
    void shareBlob(resultBlob, resultFilename || "compressed.pdf");
  }, [resultBlob, resultFilename]);

  const handleProcess = (selection: { path: ProcessingPathId }) => {
    if (selection.path === "browser") {
      void onBrowserCompress();
      return;
    }
    if (!isSignedIn) {
      onRequestSignIn();
      return;
    }
    if (enhancedUiEnabled && typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      onOpenModeModal();
    } else {
      onPremiumCompress();
    }
  };

  const centerPreview = file && stage !== "done" ? <MasterToolCenterPreview file={file} /> : null;

  const donePreview = useMemo(() => {
    if (stage !== "done" || !file || !resultBlob) return null;
    return (
      <CompressBeforeAfterPreview
        original={file}
        resultBlob={resultBlob}
        resultFilename={resultFilename}
      />
    );
  }, [stage, file, resultBlob, resultFilename]);

  const rightPanel =
    stage === "done" ? (
      <MasterToolDonePanel
        title={meta.doneTitle}
        onDownload={onDownload ?? defaultDownload}
        onShare={defaultShare}
        onReset={onReset}
        nextActions={meta.nextActions}
      />
    ) : (stage as string) === "processing" ? (
      <MasterToolProgressCard progress={activeProgress} label="Compressing" />
    ) : (
      <DesktopToolStepPanel
        toolSlug="compress-pdf"
        isSignedIn={isSignedIn}
        disabled={(stage as string) === "processing"}
        compressionLevel={level}
        onCompressionLevelChange={onLevelChange}
        processLabel="Compress PDF"
        panelTitle="Compress PDF"
        isProcessing={(stage as string) === "processing"}
        progress={activeProgress}
        onRequestSignIn={onRequestSignIn}
        onProcess={handleProcess}
      />
    );

  return (
    <MasterToolWorkspace
      toolSlug="compress-pdf"
      stage={stage}
      file={file}
      onFiles={onFiles}
      onReset={onReset}
      progress={activeProgress}
      configureContent={centerPreview}
      hideFileMetaBar
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={objectUrl}
      resultPreview={donePreview}
      rightPanel={rightPanel}
    />
  );
}

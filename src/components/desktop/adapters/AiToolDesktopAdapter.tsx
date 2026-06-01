"use client";

import { useCallback, type ReactNode } from "react";
import { MasterToolWorkspace } from "@/components/desktop/master/MasterToolWorkspace";
import { MasterToolCenterPreview } from "@/components/desktop/master/MasterToolCenterPreview";
import { MasterToolDonePanel } from "@/components/desktop/master/MasterToolDonePanel";
import { MasterToolProgressCard } from "@/components/desktop/master/MasterToolActionCards";
import { DesktopAiStepPanel } from "@/components/desktop/wizard/DesktopAiStepPanel";
import { getToolDesktopMeta } from "@/lib/desktop/toolMeta";
import type { MasterToolStage } from "@/lib/desktop/types";
import type { AiDocumentProcessingMode } from "@/lib/processing/aiCloudOptions";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";

export type AiToolDesktopAdapterProps = {
  toolSlug: string;
  stage: MasterToolStage;
  file: File | null;
  progress: number;
  resultBlob: Blob | null;
  resultFilename: string;
  objectUrl: string | null;
  onFiles: (files: File[]) => void | Promise<void>;
  onReset: () => void;
  onDownload?: () => void;
  isSignedIn: boolean;
  aiTrialAvailable?: boolean;
  showBrowser?: boolean;
  settings?: ReactNode;
  onRequestSignIn: () => void;
  onChooseMode: (mode: AiDocumentProcessingMode) => void | Promise<void>;
  onDeferredCloudStart?: (mode: AiDocumentProcessingMode) => void | Promise<void>;
};

export function AiToolDesktopAdapter({
  toolSlug,
  stage,
  file,
  progress,
  resultBlob,
  resultFilename,
  objectUrl,
  onFiles,
  onReset,
  onDownload,
  isSignedIn,
  aiTrialAvailable = true,
  showBrowser = false,
  settings,
  onRequestSignIn,
  onChooseMode,
  onDeferredCloudStart,
}: AiToolDesktopAdapterProps) {
  const meta = getToolDesktopMeta(toolSlug);

  const defaultDownload = useCallback(() => {
    if (!resultBlob) return;
    void safeDownloadBlob(resultBlob, resultFilename || "output.pdf");
  }, [resultBlob, resultFilename]);

  const defaultShare = useCallback(() => {
    if (!resultBlob) return;
    void shareBlob(resultBlob, resultFilename || "output.pdf");
  }, [resultBlob, resultFilename]);

  const centerPreview = file && stage !== "upload" ? <MasterToolCenterPreview file={file} /> : null;

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
      <MasterToolProgressCard progress={progress} label="AI processing" />
    ) : (
      <DesktopAiStepPanel
        toolSlug={toolSlug}
        file={file}
        toolLabel={meta.title}
        isSignedIn={isSignedIn}
        disabled={!file}
        isProcessing={(stage as string) === "processing"}
        progress={progress}
        showBrowser={showBrowser}
        aiTrialAvailable={aiTrialAvailable}
        settings={settings}
        onRequestSignIn={onRequestSignIn}
        onChoose={onChooseMode}
        onDeferredCloudStart={onDeferredCloudStart}
      />
    );

  return (
    <MasterToolWorkspace
      toolSlug={toolSlug}
      stage={stage}
      file={file}
      onFiles={onFiles}
      onReset={onReset}
      progress={progress}
      accept=".pdf,application/pdf"
      configureContent={centerPreview}
      hideFileMetaBar
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={objectUrl}
      rightPanel={rightPanel}
    />
  );
}

"use client";

import type { ReactNode } from "react";
import { GenericToolDesktopAdapter } from "@/components/desktop/adapters/GenericToolDesktopAdapter";
import { normalizeToolStage } from "@/lib/desktop/types";
import type { MasterToolStage } from "@/lib/desktop/types";

type Stage = MasterToolStage | "arrange" | "ready";

type Props = {
  toolSlug: string;
  stage: Stage;
  file: File | null;
  files?: File[];
  multiple?: boolean;
  progress: number;
  resultBlob: Blob | null;
  resultFilename: string;
  objectUrl?: string | null;
  onFiles: (files: File[]) => void | Promise<void>;
  onRun: () => void | Promise<void>;
  onReset: () => void;
  onDownload?: () => void;
  extraOptions?: ReactNode;
  processLabel?: string;
};

/** Browser-only tools — same 3-column shell as converter; options in right rail. */
export function BrowserToolDesktopAdapter({
  toolSlug,
  stage,
  file,
  files,
  multiple,
  progress,
  resultBlob,
  resultFilename,
  objectUrl,
  onFiles,
  onRun,
  onReset,
  onDownload,
  extraOptions,
  processLabel,
}: Props) {
  const desktopStage = normalizeToolStage(stage);

  return (
    <GenericToolDesktopAdapter
      toolSlug={toolSlug}
      stage={desktopStage}
      file={file}
      files={files}
      multiple={multiple}
      progress={progress}
      isEnhanced={false}
      cloudProgress={0}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={objectUrl ?? null}
      onFiles={onFiles}
      onProcessSelection={() => void onRun()}
      enhancedUiEnabled={false}
      isSignedIn
      onRequestSignIn={() => {}}
      onReset={onReset}
      onDownload={onDownload}
      showBrowser
      showPremium={false}
      extraOptions={extraOptions}
      processLabel={processLabel}
    />
  );
}

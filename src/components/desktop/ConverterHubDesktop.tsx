"use client";

import { useState, useCallback } from "react";
import { MasterToolWorkspace } from "@/components/desktop/master/MasterToolWorkspace";
import { DesktopConvertPickPanel } from "@/components/desktop/wizard/DesktopConvertPickPanel";
import type { MasterToolStage } from "@/lib/desktop/types";

export function ConverterHubDesktop() {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<MasterToolStage>("upload");

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setStage("configure");
  }, []);

  const reset = () => {
    setFile(null);
    setStage("upload");
  };

  const rightPanel =
    file && stage === "configure" ? (
      <DesktopConvertPickPanel file={file} onReset={reset} />
    ) : (
      <></>
    );

  return (
    <MasterToolWorkspace
      toolSlug="converter-hub"
      activeSlug="converter-hub"
      stage={stage}
      file={file}
      onFiles={handleFiles}
      onReset={reset}
      rightPanel={rightPanel}
      hideFileMetaBar
    />
  );
}

"use client";

import { useCallback, useMemo } from "react";
import { GitMerge } from "lucide-react";
import { MergeFileReorderList } from "@/components/tools/merge/MergeFileReorderList";
import { MasterToolWorkspace } from "@/components/desktop/master/MasterToolWorkspace";
import { MasterToolDonePanel } from "@/components/desktop/master/MasterToolDonePanel";
import { MasterToolProgressCard } from "@/components/desktop/master/MasterToolActionCards";
import { useToolRightRail } from "@/context/ToolRightRailContext";
import { getToolDesktopMeta } from "@/lib/desktop/toolMeta";
import { normalizeToolStage } from "@/lib/desktop/types";
import type { MasterToolStage } from "@/lib/desktop/types";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { cn } from "@/lib/utils";

type Stage = MasterToolStage | "arrange";

type Props = {
  stage: Stage;
  files: File[];
  progress: number;
  resultBlob: Blob | null;
  resultFilename: string;
  onFiles: (files: File[]) => void;
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
  onAddMore: () => void;
  onMerge: () => void;
  onReset: () => void;
};

export function MergePdfDesktopAdapter({
  stage,
  files,
  progress,
  resultBlob,
  resultFilename,
  onFiles,
  onReorder,
  onRemove,
  onAddMore,
  onMerge,
  onReset,
}: Props) {
  const meta = getToolDesktopMeta("merge-pdf");
  const desktopStage = normalizeToolStage(stage);
  const primaryFile = files[0] ?? null;
  const { highlightValidation, clearValidation } = useToolRightRail();

  const defaultDownload = useCallback(() => {
    if (!resultBlob) return;
    void safeDownloadBlob(resultBlob, resultFilename || "merged.pdf");
  }, [resultBlob, resultFilename]);

  const defaultShare = useCallback(() => {
    if (!resultBlob) return;
    void shareBlob(resultBlob, resultFilename || "merged.pdf");
  }, [resultBlob, resultFilename]);

  const handleMerge = () => {
    if (files.length < 2) {
      highlightValidation({ run: true });
      return;
    }
    clearValidation();
    onMerge();
  };

  const centerConfigure = useMemo(
    () =>
      files.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <p className="mb-3 shrink-0 text-sm font-medium text-muted-foreground">
            Drag to reorder · {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
          <MergeFileReorderList
            files={files}
            onReorder={onReorder}
            onRemove={onRemove}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          />
          <button
            type="button"
            onClick={onAddMore}
            className="mt-3 shrink-0 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            + Add more files
          </button>
        </div>
      ) : null,
    [files, onReorder, onRemove, onAddMore],
  );

  const rightPanel =
    desktopStage === "done" && resultBlob ? (
      <MasterToolDonePanel
        title={meta.doneTitle}
        onDownload={defaultDownload}
        onShare={defaultShare}
        onReset={onReset}
        nextActions={meta.nextActions}
      />
    ) : desktopStage === "processing" ? (
      <MasterToolProgressCard progress={progress} label="Merging PDFs" />
    ) : (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-foreground">Merge PDF</p>
        <div className="rounded-xl border border-border/80 bg-white p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">
            {files.length < 2
              ? "Add at least 2 files to merge. Use the center list to reorder."
              : `${files.length} files ready — order is top to bottom.`}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border bg-white p-3 shadow-sm",
            files.length < 2 ? "border-destructive/50" : "border-border/80",
          )}
        >
          <button
            type="button"
            onClick={handleMerge}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary/90"
          >
            <GitMerge className="h-4 w-4" />
            Merge {files.length} PDF{files.length !== 1 ? "s" : ""}
          </button>
          {files.length < 2 ? (
            <p className="mt-2 text-center text-xs font-medium text-destructive">
              Select at least 2 files to merge
            </p>
          ) : null}
        </div>
      </div>
    );

  return (
    <MasterToolWorkspace
      toolSlug="merge-pdf"
      stage={desktopStage}
      file={primaryFile}
      files={files}
      multiple
      onFiles={onFiles}
      onReset={onReset}
      progress={progress}
      accept=".pdf,application/pdf,image/*"
      configureContent={centerConfigure}
      hideFileMetaBar
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      rightPanel={rightPanel}
    />
  );
}

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { GitMerge, AlertCircle } from "lucide-react";
import { MergeFileReorderList } from "@/components/tools/merge/MergeFileReorderList";
import { ToolMultiFileStack } from "@/components/tools/ux/ToolMultiFileStack";
import PremiumGate from "@/components/PremiumGate";
import ToolSEO from "@/components/ToolSEO";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { mergePDFs, getMergedFilename, MERGE_ACCEPT } from "@/tools/merge-pdf/logic";
import { content } from "@/tools/merge-pdf/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { showAuthPremiumMarketingUi } from "@/lib/featureFlags";
import { isToolWorkflowAdFree } from "@/lib/toolAdPhase";
import { usePdfWorkerCleanup } from "@/hooks/usePdfWorker";
import { useWorkspaceHistory } from "@/context/WorkspaceHistoryContext";
import { persistWorkspaceOutput } from "@/lib/workspaceHistory/persistOutput";
import { useWorkspaceResume } from "@/hooks/useWorkspaceResume";
import { ToolErrorState } from "@/components/tools/ToolErrorState";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MergePdfDesktopAdapter } from "@/components/desktop/adapters/MergePdfDesktopAdapter";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { TOOL_PRIMARY_BTN, TOOL_SECONDARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { nextProgress } from "@/lib/ui/monotonicProgress";

type Stage = "upload" | "arrange" | "processing" | "done";

export default function MergePDF() {
  usePdfWorkerCleanup();
  const { i18n } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gateReason, setGateReason] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { saveSession } = useWorkspaceHistory();
  const { canUse } = usePremium();

  const resumeMergedPdf = useCallback(
    (f: File) => {
      const check = canUse(1, f.size / (1024 * 1024), "merge-pdf", { largestFileMB: f.size / (1024 * 1024) });
      if (!check.allowed) {
        setGateReason(check.reason!);
        return;
      }
      setFiles([f]);
      setStage("arrange");
      setError(null);
      setGateReason(null);
    },
    [canUse],
  );

  useWorkspaceResume({
    toolSlug: "merge-pdf",
    enabled: stage === "upload",
    onResume: resumeMergedPdf,
  });

  const handleFiles = useCallback((newFiles: File[]) => {
    const totalMB = newFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    const largestMB = Math.max(...newFiles.map((f) => f.size / (1024 * 1024)), 0);
    const check = canUse(newFiles.length, totalMB, "merge-pdf", { largestFileMB: largestMB });
    if (!check.allowed) {
      setGateReason(check.reason!);
      logToolError("merge-pdf", "upload_premium_blocked", new Error(check.reason ?? "blocked"));
      return;
    }
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      const totalMB2 = combined.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
      const largestMB2 = Math.max(...combined.map((f) => f.size / (1024 * 1024)), 0);
      const check2 = canUse(combined.length, totalMB2, "merge-pdf", { largestFileMB: largestMB2 });
      if (!check2.allowed) {
        setGateReason(check2.reason!);
        logToolError("merge-pdf", "upload_premium_blocked", new Error(check2.reason ?? "blocked"));
        return prev;
      }
      return combined;
    });
    setStage("arrange");
    setError(null);
  }, [canUse]);

  function removeFile(index: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setStage("upload");
      return next;
    });
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError("Please add at least 2 files (PDF or images) to merge.");
      return;
    }
    setStage("processing");
    setProgress(0);
    setError(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      setProgress(0);
      await runTieredThenCleanup(
        files,
        {
          onProgress: (u, t) => {
            const safe = Math.max(t, 1);
            setProgress((p) => nextProgress(p, Math.round((u / safe) * 45)));
          },
        },
        async () => {
          timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 8, 90))), 200);
          try {
            const result = await mergePDFs(files);
            setProgress(100);
            const blob = new Blob([result as BlobPart], { type: "application/pdf" });
            const originalSize = files.reduce((s, f) => s + f.size, 0);
            const filename = getMergedFilename(files);
            setProcessedFile({
              blob,
              filename,
              tool: "Merge PDF",
              toolSlug: "merge-pdf",
              originalSize,
              processedSize: result.length,
            });
            setResultBlob(blob);
            setResultFilename(filename);
            persistWorkspaceOutput(saveSession, {
              filename,
              toolSlug: "merge-pdf",
              toolLabel: "Merge PDF",
              data: result,
            });
            setStage("done");
          } finally {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        },
      );
    } catch (err) {
      logToolError("merge-pdf", "merge_processing", err, { recoverable: true });
      setError(err instanceof Error ? err.message : "Failed to merge PDFs. Please try again.");
      setStage("arrange");
    } finally {
      if (timer) clearInterval(timer);
    }
  }

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload"
    : stage === "arrange" ? "configure"
    : stage === "processing" ? "processing"
    : "done";

  const resetAll = () => {
    setFiles([]);
    setStage("upload");
    setProgress(0);
    setError(null);
    setGateReason(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  const desktopExperience = (
    <MergePdfDesktopAdapter
      stage={stage}
      files={files}
      progress={progress}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      onFiles={handleFiles}
      onReorder={setFiles}
      onRemove={removeFile}
      onAddMore={() => setStage("upload")}
      onMerge={() => void handleMerge()}
      onReset={resetAll}
    />
  );

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload"
      ? "upload"
      : stage === "arrange"
        ? "configure"
        : stage === "processing"
          ? "process"
          : "done";

  const mobileMergeButton =
    stage === "arrange" && files.length >= 2 ? (
      <button
        type="button"
        data-testid="button-merge-pdf-mobile-sticky"
        onClick={handleMerge}
        className={TOOL_PRIMARY_BTN}
      >
        <GitMerge className="h-4 w-4" />
        Merge {files.length} PDFs
      </button>
    ) : null;

  const mobilePage = (
    <>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="merge-pdf" lang={i18n.language} />
      <MobileToolLayout
        slug="merge-pdf"
        toolLabel={content.hero.title}
        title={content.hero.title}
        workflowStep={mobileWorkflowStep}
        processButton={mobileMergeButton}
        autoOpenSettings={stage === "done" && Boolean(resultBlob)}
        postProcessPanel={
          resultBlob ? (
            <MobilePostProcessPanel
              currentSlug="merge-pdf"
              onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
              onShare={() => void shareBlob(resultBlob, resultFilename)}
              onProcessAnother={resetAll}
              downloadLabel="Download merged PDF"
            />
          ) : undefined
        }
      >
        {gateReason ? (
          <div className="mb-3">
            {showAuthPremiumMarketingUi() ? (
              <PremiumGate reason={gateReason} onDismiss={() => setGateReason(null)} />
            ) : (
              <div
                className="flex flex-col gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">{gateReason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGateReason(null)}
                  className="self-end rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ) : null}

        {error && stage !== "processing" ? (
          <ToolErrorState
            title="Merge failed"
            message={error}
            onRetry={() => {
              setError(null);
              if (files.length >= 2) void handleMerge();
            }}
            className="mb-3 py-6"
          />
        ) : null}

        <ToolWorkflowShell
          stage={workflowStage}
          toolSlug="merge-pdf"
          progress={stage === "processing" ? progress : undefined}
          progressLabel={stage === "processing" ? "Staging upload & merging…" : undefined}
          processingTitle="Merging your PDFs..."
          processingSubtitle="Processing in your browser"
          upload={
            <ToolMultiFileStack
              files={files}
              onAddFiles={handleFiles}
              onRemoveAt={removeFile}
              accept={MERGE_ACCEPT}
              addLabel="+ Add PDFs or photos"
              reorderHandle
            />
          }
          configure={
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Drag to reorder · {files.length} file{files.length !== 1 ? "s" : ""}
              </p>
              <MergeFileReorderList files={files} onReorder={setFiles} onRemove={removeFile} className="mb-4" />
              <button
                type="button"
                data-testid="button-add-more-files"
                onClick={() => setStage("upload")}
                className={`${TOOL_SECONDARY_BTN} w-full`}
              >
                + Add more files
              </button>
            </div>
          }
          done={
            resultBlob ? (
              <ToolResultPanel
                blob={resultBlob}
                filename={resultFilename}
                sourceFile={files.length === 1 ? files[0] : undefined}
                sourceFiles={files.length > 1 ? files : undefined}
                toolSlug="merge-pdf"
                executedVia="browser"
                title="Merged PDF ready"
                hideFooterAd={isToolWorkflowAdFree(stage)}
                actionsPlacement="rail"
                onProcessAnother={resetAll}
              />
            ) : (
              <div />
            )
          }
        />
      </MobileToolLayout>
    </>
  );

  return <ToolPageSplit desktop={desktopExperience} mobile={mobilePage} />;
}

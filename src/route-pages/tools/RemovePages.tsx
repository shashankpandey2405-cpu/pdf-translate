import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, AlertCircle } from "lucide-react";
import DropZone from "@/components/DropZone";
import ToolAdLayout from "@/components/ToolAdLayout";
import ToolSEO from "@/components/ToolSEO";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import ToolHeader from "@/components/tools/ToolHeader";
import { ToolPagePremiumLayout } from "@/components/tools/ToolPagePremiumLayout";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { PdfPageThumbnailGrid } from "@/components/tools/PdfPageThumbnailGrid";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { removePdfPages, getRemovePagesFilename } from "@/lib/pdfPageTools/logic";
import { content } from "@/tools/remove-pages/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { isToolWorkflowAdFree, showToolSidebarAd } from "@/lib/toolAdPhase";
import { usePdfPageThumbnails } from "@/hooks/usePdfPageThumbnails";
import { assessBrowserWorkload } from "@/lib/limits/deviceAdaptiveLimits";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

export default function RemovePages() {
  const { i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [toRemove, setToRemove] = useState<Set<number>>(new Set());
  const [stage, setStage] = useState<"upload" | "select" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { canUse, isSignedIn } = usePremium();
  const { thumbnails, pageCount, loading: thumbsLoading, error: thumbError } = usePdfPageThumbnails(file);

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      const check = assessBrowserWorkload({
        slug: "remove-pages",
        fileCount: 1,
        largestFileMB: f.size / (1024 * 1024),
        isSignedIn,
      });
      if (!check.allowed) {
        setError(check.message ?? "File too large for this device.");
        return;
      }
      const legacy = canUse(1, f.size / (1024 * 1024), "remove-pages", {
        largestFileMB: f.size / (1024 * 1024),
      });
      if (!legacy.allowed) {
        setError(legacy.reason!);
        return;
      }
      setFile(f);
      setStage("select");
      setError(null);
      setToRemove(new Set());
    },
    [canUse, isSignedIn],
  );

  function togglePage(i: number) {
    setToRemove((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  async function handleRemove() {
    if (!file || toRemove.size === 0) return;
    if (toRemove.size >= pageCount) {
      setError("Keep at least one page in the document.");
      return;
    }
    setStage("processing");
    setProgress(0);
    setError(null);
    const indices = Array.from(toRemove);
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      await runTieredThenCleanup([file], { onProgress: (u, t) => setProgress((p) => nextProgress(p, Math.round((u / Math.max(t, 1)) * 70))) }, async () => {
        timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 10, 95))), 200);
        try {
          const result = await removePdfPages(file, indices);
          setProgress(100);
          const blob = new Blob([result as BlobPart], { type: "application/pdf" });
          const filename = getRemovePagesFilename(file.name, indices.length);
          setProcessedFile({
            blob,
            filename,
            tool: "Remove PDF Pages",
            toolSlug: "remove-pages",
            originalSize: file.size,
            processedSize: result.length,
          });
          setResultBlob(blob);
          setResultFilename(filename);
          setStage("done");
        } finally {
          if (timer) clearInterval(timer);
        }
      });
    } catch (err) {
      logToolError("remove-pages", "remove_processing", err);
      setError(err instanceof Error ? err.message : "Remove failed.");
      setStage("select");
    }
  }

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload" : stage === "select" ? "configure" : stage === "processing" ? "processing" : "done";

  const displayError = error || thumbError;
  const keepCount = pageCount - toRemove.size;

  const resetAll = () => {
    setFile(null);
    setToRemove(new Set());
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload" ? "upload" : stage === "select" ? "configure" : stage === "processing" ? "process" : "done";

  const mobileRemoveButton =
    stage === "select" && file && toRemove.size > 0 && toRemove.size < pageCount ? (
      <button
        type="button"
        data-testid="button-remove-pages-mobile"
        onClick={() => void handleRemove()}
        disabled={thumbsLoading}
        className={TOOL_PRIMARY_BTN}
      >
        <Trash2 className="h-4 w-4" />
        Remove {toRemove.size} page{toRemove.size !== 1 ? "s" : ""}
      </button>
    ) : null;

  const configureContent = file ? (
    <div>
      <div className="mb-3 lg:hidden">
        <ToolUploadedFileCard file={file} showSuccessBadge={false} />
        <p className="mt-1 text-center text-xs text-muted-foreground">{pageCount} pages</p>
      </div>
      <div className="mb-4 hidden lg:block">
        <ToolInputPreview file={file} label="Your PDF" previewLayout="paged" className="max-w-md" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground lg:text-sm">
          {toRemove.size} to remove · {keepCount} will stay
        </p>
        <button type="button" onClick={() => setToRemove(new Set())} className="text-xs font-semibold text-primary hover:underline lg:text-sm">
          Clear
        </button>
      </div>
      <PdfPageThumbnailGrid
        thumbnails={thumbnails}
        pageCount={pageCount}
        loading={thumbsLoading}
        selected={toRemove}
        onToggle={togglePage}
        variant="remove"
      />
      <button
        type="button"
        data-testid="button-remove-pages"
        onClick={() => void handleRemove()}
        disabled={toRemove.size === 0 || toRemove.size >= pageCount || thumbsLoading}
        className={`${TOOL_PRIMARY_BTN} mt-4 hidden lg:flex`}
      >
        <Trash2 className="h-4 w-4" />
        Remove {toRemove.size} page{toRemove.size !== 1 ? "s" : ""}
      </button>
    </div>
  ) : null;

  const workflowShell = (
    <ToolWorkflowShell
      stage={workflowStage}
      toolSlug="remove-pages"
      progress={stage === "processing" ? progress : undefined}
      processingTitle="Removing pages…"
      processingSubtitle="Processing in your browser"
      upload={
        <DropZone
          onFiles={handleFiles}
          multiple={false}
          label="Drop your PDF here"
          sublabel="Tap pages to delete — at least one page must remain"
          lockSuccess
        />
      }
      configure={configureContent}
      done={
        resultBlob ? (
          <ToolResultPanel
            blob={resultBlob}
            filename={resultFilename}
            sourceFile={file}
            toolSlug="remove-pages"
            executedVia="browser"
            title="Updated PDF"
            hideFooterAd={isToolWorkflowAdFree(stage)}
            onProcessAnother={resetAll}
          />
        ) : (
          <div />
        )
      }
    />
  );

  const mobilePage = (
    <>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="remove-pages" lang={i18n.language} />
      <MobileToolLayout
        slug="remove-pages"
        toolLabel={content.hero.title}
        title={content.hero.title}
        workflowStep={mobileWorkflowStep}
        processButton={mobileRemoveButton}
        autoOpenSettings={stage === "done" && Boolean(resultBlob)}
        postProcessPanel={
          resultBlob ? (
            <MobilePostProcessPanel
              currentSlug="remove-pages"
              onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
              onProcessAnother={resetAll}
              downloadLabel="Download updated PDF"
            />
          ) : undefined
        }
      >
        {displayError ? (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {displayError}
          </div>
        ) : null}
        {workflowShell}
      </MobileToolLayout>
    </>
  );

  const desktopPage = (
    <ToolPagePremiumLayout slug="remove-pages" toolName={content.hero.title}>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="remove-pages" lang={i18n.language} />
      <ToolAdLayout
        hideAds={isToolWorkflowAdFree(stage)}
        showSidebarAd={showToolSidebarAd(stage)}
        main={
          <>
            <ToolHeader
              title={content.hero.title}
              subtitle={content.hero.subtitle}
              icon={<Trash2 className="h-5 w-5 text-red-600" />}
              iconClassName="bg-red-50"
            />
            <ToolWorkflowActions onReset={resetAll} resetDisabled={stage === "processing"} className="mb-4" />
            {displayError ? (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {displayError}
              </div>
            ) : null}
            {workflowShell}
          </>
        }
        sidebar={
          <div className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
            <h3 className="mb-4 text-sm font-bold text-foreground">How it works</h3>
            <div className="space-y-4">
              {content.steps.map((step) => (
                <div key={step.number} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {step.number}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </ToolPagePremiumLayout>
  );

  return <ToolPageSplit desktop={desktopPage} mobile={mobilePage} />;
}

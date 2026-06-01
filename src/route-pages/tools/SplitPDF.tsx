import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Scissors, AlertCircle } from "lucide-react";
import { PdfPageThumbnailGrid } from "@/components/tools/PdfPageThumbnailGrid";
import DropZone from "@/components/DropZone";
import ToolAdLayout from "@/components/ToolAdLayout";
import ToolSEO from "@/components/ToolSEO";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import ToolHeader from "@/components/tools/ToolHeader";
import { ToolPagePremiumLayout } from "@/components/tools/ToolPagePremiumLayout";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { splitPDF, getSplitFilename } from "@/tools/split-pdf/logic";
import { usePdfPageThumbnails } from "@/hooks/usePdfPageThumbnails";
import { content } from "@/tools/split-pdf/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { isToolWorkflowAdFree, showToolSidebarAd } from "@/lib/toolAdPhase";
import { usePdfWorkerCleanup } from "@/hooks/usePdfWorker";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

export default function SplitPDF() {
  usePdfWorkerCleanup();
  const { i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [stage, setStage] = useState<"upload" | "select" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { canUse } = usePremium();
  const { thumbnails, pageCount, loading: thumbsLoading, error: thumbError } = usePdfPageThumbnails(file);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    const totalMB = f.size / (1024 * 1024);
    const check = canUse(1, totalMB, "split-pdf", { largestFileMB: totalMB });
    if (!check.allowed) {
      setError(check.reason!);
      logToolError("split-pdf", "upload_premium_blocked", new Error(check.reason ?? "blocked"));
      return;
    }
    setFile(f);
    setStage("select");
    setError(null);
    setSelectedPages(new Set());
  }, [canUse]);

  function togglePage(index: number) {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  }

  const displayError = error || thumbError;

  async function handleSplit() {
    if (!file || selectedPages.size === 0) { setError("Select at least one page to extract."); return; }
    setStage("processing");
    setProgress(0);
    setError(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      await runTieredThenCleanup(
        [file],
        {
          onProgress: (u, t) => {
            const safe = Math.max(t, 1);
            setProgress((p) => nextProgress(p, Math.round((u / safe) * 70)));
          },
        },
        async () => {
          timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 10, 95))), 180);
          try {
            const indices = Array.from(selectedPages).sort((a, b) => a - b);
            const result = await splitPDF(file, indices);
            setProgress(100);
            const blob = new Blob([result as BlobPart], { type: "application/pdf" });
            const filename = getSplitFilename(file.name, indices);
            setProcessedFile({
              blob,
              filename,
              tool: "Split PDF",
              toolSlug: "split-pdf",
              originalSize: file.size,
              processedSize: result.length,
            });
            setResultBlob(blob);
            setResultFilename(filename);
            setStage("done");
          } finally {
            if (timer) clearInterval(timer);
            timer = null;
          }
        },
      );
    } catch (err) {
      logToolError("split-pdf", "split_processing", err);
      setError(err instanceof Error ? err.message : "Failed to split PDF.");
      setStage("select");
    }
  }

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload"
    : stage === "select" ? "configure"
    : stage === "processing" ? "processing"
    : "done";

  const resetAll = () => {
    setFile(null);
    setSelectedPages(new Set());
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload"
      ? "upload"
      : stage === "select"
        ? "configure"
        : stage === "processing"
          ? "process"
          : "done";

  const mobileExtractButton =
    stage === "select" && selectedPages.size > 0 ? (
      <button
        type="button"
        data-testid="button-split-pdf-mobile-sticky"
        onClick={handleSplit}
        disabled={thumbsLoading}
        className={TOOL_PRIMARY_BTN}
      >
        <Scissors className="h-4 w-4" />
        Extract {selectedPages.size} Page{selectedPages.size !== 1 ? "s" : ""}
      </button>
    ) : null;

  const configureContent = (
    <div>
      {file ? (
        <>
          <div className="mb-3 lg:hidden">
            <ToolUploadedFileCard file={file} showSuccessBadge={false} />
            <p className="mt-1 text-center text-xs text-muted-foreground">{pageCount} pages</p>
          </div>
          <div className="mb-4 hidden lg:block">
            <ToolInputPreview file={file} label="Your PDF" previewLayout="paged" className="max-w-md" />
          </div>
        </>
      ) : null}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground lg:text-sm">
          {selectedPages.size} of {pageCount} pages selected
        </p>
        <button type="button" onClick={selectAll} className="text-xs font-semibold text-primary hover:underline lg:text-sm">
          Select all
        </button>
      </div>
      <PdfPageThumbnailGrid
        thumbnails={thumbnails}
        pageCount={pageCount}
        loading={thumbsLoading}
        selected={selectedPages}
        onToggle={togglePage}
        variant="extract"
      />
      <button
        type="button"
        data-testid="button-split-pdf"
        onClick={handleSplit}
        disabled={selectedPages.size === 0 || thumbsLoading}
        className={`${TOOL_PRIMARY_BTN} mt-4 hidden lg:flex`}
      >
        <Scissors className="h-4 w-4" />
        Extract {selectedPages.size} Page{selectedPages.size !== 1 ? "s" : ""}
      </button>
    </div>
  );

  const workflowShell = (
    <ToolWorkflowShell
      stage={workflowStage}
      toolSlug="split-pdf"
      progress={stage === "processing" ? progress : undefined}
      progressLabel={stage === "processing" ? "Staging upload & extracting…" : undefined}
      processingTitle="Extracting pages…"
      processingSubtitle="Processing in your browser"
      upload={<DropZone onFiles={handleFiles} multiple={false} label="Drop your PDF here" sublabel="Select pages to extract" />}
      configure={configureContent}
      done={
        resultBlob ? (
          <ToolResultPanel
            blob={resultBlob}
            filename={resultFilename}
            sourceFile={file}
            title="Extracted PDF ready"
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
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="split-pdf" lang={i18n.language} />
      <MobileToolLayout
        slug="split-pdf"
        toolLabel={content.hero.title}
        title={content.hero.title}
        workflowStep={mobileWorkflowStep}
        processButton={mobileExtractButton}
        autoOpenSettings={stage === "done" && Boolean(resultBlob)}
        postProcessPanel={
          resultBlob ? (
            <MobilePostProcessPanel
              currentSlug="split-pdf"
              onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
              onProcessAnother={resetAll}
              downloadLabel="Download extracted PDF"
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
    <ToolPagePremiumLayout slug="split-pdf" toolName={content.hero.title}>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="split-pdf" lang={i18n.language} />
      <ToolAdLayout
        hideAds={isToolWorkflowAdFree(stage)}
        showSidebarAd={showToolSidebarAd(stage)}
        main={(
          <>
            <ToolHeader
              title={content.hero.title}
              subtitle={content.hero.subtitle}
              icon={<Scissors className="h-5 w-5 text-purple-600" />}
              iconClassName="bg-purple-50"
            />
            <ToolWorkflowActions onReset={resetAll} resetDisabled={stage === "processing"} className="mb-4" />
            {displayError ? (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {displayError}
              </div>
            ) : null}
            {workflowShell}
          </>
        )}
        sidebar={(
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold text-foreground">How it works</h3>
            <div className="space-y-4">
              {content.steps.map((step) => (
                <div key={step.number} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{step.number}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </ToolPagePremiumLayout>
  );

  return <ToolPageSplit desktop={desktopPage} mobile={mobilePage} />;
}

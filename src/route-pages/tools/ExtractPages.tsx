import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileOutput, AlertCircle } from "lucide-react";
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
import { extractPdfPages, getExtractFilename } from "@/lib/pdfPageTools/logic";
import { content } from "@/tools/extract-pages/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { isToolWorkflowAdFree, showToolSidebarAd } from "@/lib/toolAdPhase";
import { usePdfPageThumbnails } from "@/hooks/usePdfPageThumbnails";
import { assessBrowserWorkload } from "@/lib/limits/deviceAdaptiveLimits";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

export default function ExtractPages() {
  const { i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
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
        slug: "extract-pages",
        fileCount: 1,
        largestFileMB: f.size / (1024 * 1024),
        isSignedIn,
      });
      if (!check.allowed) {
        setError(check.message ?? "File too large for this device.");
        return;
      }
      const legacy = canUse(1, f.size / (1024 * 1024), "extract-pages", {
        largestFileMB: f.size / (1024 * 1024),
      });
      if (!legacy.allowed) {
        setError(legacy.reason!);
        return;
      }
      setFile(f);
      setStage("select");
      setError(null);
      setSelectedPages(new Set());
    },
    [canUse, isSignedIn],
  );

  function togglePage(i: number) {
    setSelectedPages((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function selectAll() {
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  }

  async function handleExtract() {
    if (!file || selectedPages.size === 0) return;
    setStage("processing");
    setProgress(0);
    setError(null);
    const indices = Array.from(selectedPages).sort((a, b) => a - b);
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      await runTieredThenCleanup([file], { onProgress: (u, t) => setProgress((p) => nextProgress(p, Math.round((u / Math.max(t, 1)) * 70))) }, async () => {
        timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 10, 95))), 200);
        try {
          const result = await extractPdfPages(file, indices);
          setProgress(100);
          const blob = new Blob([result as BlobPart], { type: "application/pdf" });
          const filename = getExtractFilename(file.name, indices);
          setProcessedFile({
            blob,
            filename,
            tool: "Extract PDF Pages",
            toolSlug: "extract-pages",
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
      logToolError("extract-pages", "extract_processing", err);
      setError(err instanceof Error ? err.message : "Extraction failed.");
      setStage("select");
    }
  }

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload" : stage === "select" ? "configure" : stage === "processing" ? "processing" : "done";

  const displayError = error || thumbError;

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
        data-testid="button-extract-pages-mobile-sticky"
        onClick={() => void handleExtract()}
        disabled={thumbsLoading}
        className={TOOL_PRIMARY_BTN}
      >
        <FileOutput className="h-4 w-4" />
        Extract {selectedPages.size} page{selectedPages.size !== 1 ? "s" : ""}
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
        data-testid="button-extract-pages"
        onClick={() => void handleExtract()}
        disabled={selectedPages.size === 0 || thumbsLoading}
        className={`${TOOL_PRIMARY_BTN} mt-4 hidden lg:flex`}
      >
        <FileOutput className="h-4 w-4" />
        Extract {selectedPages.size} page{selectedPages.size !== 1 ? "s" : ""}
      </button>
    </div>
  ) : null;

  const workflowShell = (
    <ToolWorkflowShell
      stage={workflowStage}
      toolSlug="extract-pages"
      progress={stage === "processing" ? progress : undefined}
      processingTitle="Extracting pages…"
      processingSubtitle="Processing in your browser"
      upload={
        <DropZone
          onFiles={handleFiles}
          multiple={false}
          label="Drop your PDF here"
          sublabel="Select pages to extract"
        />
      }
      configure={configureContent}
      done={
        resultBlob ? (
          <ToolResultPanel
            blob={resultBlob}
            filename={resultFilename}
            sourceFile={file}
            toolSlug="extract-pages"
            executedVia="browser"
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
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="extract-pages" lang={i18n.language} />
      <MobileToolLayout
        slug="extract-pages"
        toolLabel={content.hero.title}
        title={content.hero.title}
        workflowStep={mobileWorkflowStep}
        processButton={mobileExtractButton}
        autoOpenSettings={stage === "done" && Boolean(resultBlob)}
        postProcessPanel={
          resultBlob ? (
            <MobilePostProcessPanel
              currentSlug="extract-pages"
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
    <ToolPagePremiumLayout slug="extract-pages" toolName={content.hero.title}>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="extract-pages" lang={i18n.language} />
      <ToolAdLayout
        hideAds={isToolWorkflowAdFree(stage)}
        showSidebarAd={showToolSidebarAd(stage)}
        main={
          <>
            <ToolHeader
              title={content.hero.title}
              subtitle={content.hero.subtitle}
              icon={<FileOutput className="h-5 w-5 text-violet-600" />}
              iconClassName="bg-violet-50"
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
          <div className="rounded-2xl border border-border bg-card p-5">
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

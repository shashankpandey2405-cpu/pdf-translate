import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, AlertCircle } from "lucide-react";
import DropZone from "@/components/DropZone";
import ToolAdLayout from "@/components/ToolAdLayout";
import ToolSEO from "@/components/ToolSEO";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import ToolHeader from "@/components/tools/ToolHeader";
import { ToolPagePremiumLayout } from "@/components/tools/ToolPagePremiumLayout";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { OrganizePageSortableGrid } from "@/components/tools/OrganizePageSortableGrid";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { organizePdfPages, getOrganizeFilename } from "@/lib/pdfPageTools/logic";
import { content } from "@/tools/organize-pdf/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { isToolWorkflowAdFree, showToolSidebarAd } from "@/lib/toolAdPhase";
import { usePdfPageThumbnails } from "@/hooks/usePdfPageThumbnails";
import { assessBrowserWorkload } from "@/lib/limits/deviceAdaptiveLimits";
import { ToolErrorState } from "@/components/tools/ToolErrorState";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

export default function OrganizePdf() {
  const { i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [stage, setStage] = useState<"upload" | "select" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { canUse, isSignedIn } = usePremium();
  const { thumbnails, pageCount, loading: thumbsLoading, error: thumbError } = usePdfPageThumbnails(file);

  useEffect(() => {
    if (pageCount > 0) {
      setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
    } else {
      setPageOrder([]);
    }
  }, [pageCount]);

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      const check = assessBrowserWorkload({
        slug: "organize-pdf",
        fileCount: 1,
        largestFileMB: f.size / (1024 * 1024),
        isSignedIn,
      });
      if (!check.allowed) {
        setError(check.message ?? "File too large for this device.");
        return;
      }
      const legacy = canUse(1, f.size / (1024 * 1024), "organize-pdf", {
        largestFileMB: f.size / (1024 * 1024),
      });
      if (!legacy.allowed) {
        setError(legacy.reason!);
        return;
      }
      setFile(f);
      setStage("select");
      setError(null);
    },
    [canUse, isSignedIn],
  );

  async function handleOrganize() {
    if (!file || pageOrder.length < 1) return;
    setStage("processing");
    setProgress(0);
    setError(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      await runTieredThenCleanup([file], { onProgress: (u, t) => setProgress((p) => nextProgress(p, Math.round((u / Math.max(t, 1)) * 70))) }, async () => {
        timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 10, 95))), 200);
        try {
          const result = await organizePdfPages(file, pageOrder);
          setProgress(100);
          const blob = new Blob([result as BlobPart], { type: "application/pdf" });
          const filename = getOrganizeFilename(file.name);
          setProcessedFile({
            blob,
            filename,
            tool: "Organize PDF",
            toolSlug: "organize-pdf",
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
      logToolError("organize-pdf", "organize_processing", err);
      setError(err instanceof Error ? err.message : "Organize failed.");
      setStage("select");
    }
  }

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload" : stage === "select" ? "configure" : stage === "processing" ? "processing" : "done";

  const displayError = error || thumbError;

  const resetAll = () => {
    setFile(null);
    setPageOrder([]);
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload" ? "upload" : stage === "select" ? "configure" : stage === "processing" ? "process" : "done";

  const mobileOrganizeButton =
    stage === "select" && file && pageOrder.length >= 1 && !displayError ? (
      <button
        type="button"
        data-testid="button-organize-pdf-mobile-sticky"
        onClick={() => void handleOrganize()}
        disabled={thumbsLoading}
        className={TOOL_PRIMARY_BTN}
      >
        <LayoutGrid className="h-4 w-4" />
        Apply page order
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
      <p className="mb-3 text-xs text-muted-foreground lg:text-sm">
        Drag pages into order. Labels show new position and original page number.
      </p>
      <OrganizePageSortableGrid
        thumbnails={thumbnails}
        pageOrder={pageOrder}
        onReorder={setPageOrder}
        loading={thumbsLoading}
      />
      <button
        type="button"
        data-testid="button-organize-pdf"
        onClick={() => void handleOrganize()}
        disabled={pageOrder.length < 1 || thumbsLoading}
        className={`${TOOL_PRIMARY_BTN} mt-4 hidden lg:flex`}
      >
        <LayoutGrid className="h-4 w-4" />
        Apply page order
      </button>
    </div>
  ) : null;

  const workflowShell = (
    <ToolWorkflowShell
      stage={workflowStage}
      toolSlug="organize-pdf"
      progress={stage === "processing" ? progress : undefined}
      processingTitle="Reordering pages…"
      processingSubtitle="Processing in your browser"
      upload={
        <DropZone
          onFiles={handleFiles}
          multiple={false}
          label="Drop your PDF here"
          sublabel="Drag thumbnails to reorder — 100% private"
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
            toolSlug="organize-pdf"
            executedVia="browser"
            title="Organized PDF"
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
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="organize-pdf" lang={i18n.language} />
      <MobileToolLayout
        slug="organize-pdf"
        toolLabel={content.hero.title}
        title={content.hero.title}
        workflowStep={mobileWorkflowStep}
        processButton={mobileOrganizeButton}
        autoOpenSettings={stage === "done" && Boolean(resultBlob)}
        postProcessPanel={
          resultBlob ? (
            <MobilePostProcessPanel
              currentSlug="organize-pdf"
              onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
              onProcessAnother={resetAll}
              downloadLabel="Download organized PDF"
            />
          ) : undefined
        }
      >
        {displayError && stage !== "upload" ? (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {displayError}
          </div>
        ) : null}
        {workflowShell}
      </MobileToolLayout>
    </>
  );

  const desktopPage = (
    <ToolPagePremiumLayout slug="organize-pdf" toolName={content.hero.title}>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="organize-pdf" lang={i18n.language} />
      <ToolAdLayout
        hideAds={isToolWorkflowAdFree(stage)}
        showSidebarAd={showToolSidebarAd(stage)}
        main={
          <>
            <ToolHeader
              title={content.hero.title}
              subtitle={content.hero.subtitle}
              icon={<LayoutGrid className="h-5 w-5 text-indigo-600" />}
              iconClassName="bg-indigo-50"
            />
            <ToolWorkflowActions onReset={resetAll} resetDisabled={stage === "processing"} className="mb-4" />
            {displayError && stage !== "upload" ? (
              <ToolErrorState
                title="Could not load or organize PDF"
                message={displayError}
                onRetry={() => {
                  setError(null);
                  if (stage === "select" && file) void handleOrganize();
                }}
                retryLabel={stage === "select" && file && !thumbError ? "Try again" : undefined}
                className="mb-4 py-8"
              />
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

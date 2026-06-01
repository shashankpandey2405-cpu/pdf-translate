import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Minimize2 } from "lucide-react";
import DropZone from "@/components/DropZone";
import ToolSEO from "@/components/ToolSEO";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { CompressLevelPicker } from "@/components/tools/CompressLevelPicker";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { useProcess } from "@/context/ProcessContext";
import { compressPDF, CompressionLevel } from "@/tools/compress-pdf/logic";
import { content } from "@/tools/compress-pdf/content";
import { logToolError } from "@/utils/logger";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { isToolWorkflowAdFree } from "@/lib/toolAdPhase";
import { usePdfWorkerCleanup } from "@/hooks/usePdfWorker";
import { HybridToolChrome } from "@/components/processing/HybridToolChrome";
import { HybridModeSheetPanel } from "@/components/processing/HybridModeSheetPanel";
import { useHybridToolWorkflow } from "@/hooks/useHybridToolWorkflow";
import { saveHybridUploadSession, newUploadSessionId } from "@/lib/processing/hybridUploadSession";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { FileLimitModal } from "@/components/processing/FileLimitModal";
import { FallbackToPremiumModal } from "@/components/processing/FallbackToPremiumModal";
import { useProcessingValidation } from "@/hooks/useProcessingValidation";
import { ProcessingStatusPanel } from "@/components/processing/ProcessingStatusPanel";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { useToolProcessingState } from "@/hooks/useToolProcessingState";
import { EnhancedToolResultPanel } from "@/components/history/EnhancedToolResultPanel";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { useSmartDocumentRoute } from "@/lib/processing/useSmartDocumentRoute";
import { useMemoryFailsafe } from "@/hooks/useMemoryFailsafe";
import { cloudPresetForEnhancedJob } from "@/lib/processing/compressCloudPresets";
import { CompressDesktopAdapter } from "@/components/desktop/adapters/CompressDesktopAdapter";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { usePremium } from "@/context/PremiumContext";
import { toast } from "@/hooks/use-toast";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { ToolErrorState } from "@/components/tools/ToolErrorState";

export default function CompressPDF() {
  usePdfWorkerCleanup();
  const { t, i18n } = useTranslation();
  const [level, setLevel] = useState<CompressionLevel>("recommended");
  const onHybridRestore = useCallback(async () => {
    setStage("configure");
    setError(null);
  }, []);
  const hybrid = useHybridToolWorkflow({
    toolSlug: "compress-pdf",
    settings: { level },
    onRestore: onHybridRestore,
  });
  const file = hybrid.file;
  const setFile = hybrid.setFile;
  const [stage, setStage] = useState<"upload" | "configure" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { mode, enabled: enhancedUiEnabled } = useProcessingMode();
  const premiumCloud = usePremiumCloudRun("compress-pdf", "Compress PDF");
  const enhancedLifecycle = premiumCloud.lifecycle;
  const { requestSignIn } = useAuthPrompt();
  const { isSignedIn } = usePremium();
  const isEnhanced = enhancedUiEnabled && mode === "enhanced";
  const usedEnhancedCloud =
    enhancedUiEnabled && stage === "done" && enhancedLifecycle.localBlob !== null;
  const validation = useProcessingValidation("compress-pdf");
  const failsafe = useMemoryFailsafe({
    fileSizeMB: file ? file.size / (1024 * 1024) : undefined,
  });
  const smartRoute = useSmartDocumentRoute(file, "compress-pdf");
  const processingUi = useToolProcessingState({
    hasFile: Boolean(file),
    cloudStatus: premiumCloud.status,
    uploadProgress: premiumCloud.progress,
    localStage: stage,
  });

  usePremiumFlowRestore(
    "compress-pdf",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      setFile(restored);
      setStage("configure");
      setError(null);
      hybrid.setModeModalOpen(false);
      await saveHybridUploadSession({
        sessionId: newUploadSessionId(),
        toolSlug: "compress-pdf",
        fileName: restored.name,
        mimeType: restored.type,
        blob: restored,
        settings: { level },
        preferredMode: "enhanced",
      });
    },
    { onAutoStart: () => runEnhancedCompress() },
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      await hybrid.acceptUpload(f, { openModeModal: false });
      setStage("configure");
      setError(null);
    },
    [hybrid],
  );

  async function runEnhancedCompress() {
    if (!file) return;
    const ok = await validation.validateFile(file, "enhanced");
    if (!ok) return;
    setStage("processing");
    setProgress(0);
    setError(null);
    processingUi.resetToFileSelected();
    try {
      const pages = await getPDFPageCount(file);
      const { blob, filename: cloudName } = await premiumCloud.runPremium(
        file,
        pages,
        cloudPresetForEnhancedJob(level),
      );
      const filename = cloudName.endsWith(".pdf")
        ? cloudName
        : `${file.name.replace(/\.pdf$/i, "")}_compressed.pdf`;
      setProcessedFile({
        blob,
        filename,
        tool: "Compress PDF",
        toolSlug: "compress-pdf",
        originalSize: file.size,
        processedSize: blob.size,
      });
      setResultBlob(blob);
      setResultFilename(filename);
      setStage("done");
    } catch (err) {
      logToolError("compress-pdf", "enhanced_compress", err, { recoverable: true, suppressToast: true });
      setError(err instanceof Error ? err.message : "Cloud compression failed.");
      processingUi.markFailed();
      setStage("configure");
    }
  }

  async function runBrowserCompress() {
    if (!file) return;
    const ok = await validation.validateFile(file, "browser");
    if (!ok) return;
    setStage("processing");
    setProgress(0);
    setError(null);
    processingUi.resetToFileSelected();

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
          timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 8, 95))), 180);
          try {
            const result = await compressPDF(file, { level });
            setProgress(100);
            const blob = new Blob([result as BlobPart], { type: "application/pdf" });
            const filename = file.name.replace(/\.pdf$/i, "") + `_compressed.pdf`;
            setProcessedFile({
              blob,
              filename,
              tool: "Compress PDF",
              toolSlug: "compress-pdf",
              originalSize: file.size,
              processedSize: result.length,
            });
            setResultBlob(blob);
            setResultFilename(filename);
            const saved = Math.round((1 - blob.size / file.size) * 100);
            if (saved < 5) {
              toast({
                title: "Light optimization only",
                description:
                  "Browser mode cannot shrink scanned PDFs much. Use Trusted Cloud compression for real size reduction.",
              });
            }
            setStage("done");
          } finally {
            if (timer) clearInterval(timer);
            timer = null;
          }
        },
      );
    } catch (err) {
      logToolError("compress-pdf", "compress_processing", err, { recoverable: true, suppressToast: true });
      validation.showFallback();
      setError(null);
      setStage("configure");
    }
  }

  const resetWorkflow = () => {
    void hybrid.clearSession();
    enhancedLifecycle.reset();
    setFile(null);
    setLevel("recommended");
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload"
    : stage === "configure" ? "configure"
    : stage === "processing" ? "processing"
    : "done";

  const browserPreviewUrl = useMemo(() => {
    if (!resultBlob || enhancedLifecycle.objectUrl) return null;
    return URL.createObjectURL(resultBlob);
  }, [resultBlob, enhancedLifecycle.objectUrl]);

  useEffect(() => {
    return () => {
      if (browserPreviewUrl) URL.revokeObjectURL(browserPreviewUrl);
    };
  }, [browserPreviewUrl]);

  const previewObjectUrl = enhancedLifecycle.objectUrl ?? browserPreviewUrl;

  const handleDesktopDownload = useCallback(async () => {
    if (!resultBlob) return;
    await safeDownloadBlob(resultBlob, resultFilename || "compressed.pdf");
  }, [resultBlob, resultFilename]);

  const desktopExperience = (
    <CompressDesktopAdapter
      stage={stage}
      file={file}
      level={level}
      onLevelChange={setLevel}
      progress={progress}
      isEnhanced={isEnhanced}
      cloudProgress={premiumCloud.progress}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={previewObjectUrl}
      onFiles={handleFiles}
      onBrowserCompress={() => void runBrowserCompress()}
      onPremiumCompress={() => void runEnhancedCompress()}
      onOpenModeModal={() => hybrid.setModeModalOpen(true)}
      enhancedUiEnabled={enhancedUiEnabled}
      isSignedIn={isSignedIn}
      onRequestSignIn={() =>
        requestSignIn({ reason: SIGN_IN_REASON.compressCloud, tone: "cloud" })
      }
      onReset={resetWorkflow}
      onDownload={handleDesktopDownload}
    />
  );

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload"
      ? "upload"
      : stage === "configure"
        ? "configure"
        : stage === "processing"
          ? "process"
          : "done";

  const mobileCompressButton =
    stage === "configure" && file && !error ? (
      enhancedUiEnabled ? (
        <button
          type="button"
          data-testid="button-compress-pdf-mobile-sticky"
          onClick={() => void (mode === "enhanced" ? runEnhancedCompress() : runBrowserCompress())}
          className={TOOL_PRIMARY_BTN}
        >
          <Minimize2 className="h-4 w-4" />
          {t("toolWorkspace.process", { defaultValue: "Compress PDF" })}
        </button>
      ) : (
        <button
          type="button"
          data-testid="button-compress-pdf-mobile-sticky"
          onClick={() => void runBrowserCompress()}
          className={TOOL_PRIMARY_BTN}
        >
          <Minimize2 className="h-4 w-4" />
          Compress PDF
        </button>
      )
    ) : null;

  const page = (
    <div className="lg:hidden">
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="compress-pdf" lang={i18n.language} />
      <MobileToolLayout
        slug="compress-pdf"
        toolLabel={content.hero.title}
        title={content.hero.title}
        workflowStep={mobileWorkflowStep}
        processButton={mobileCompressButton}
        autoOpenSettings={(stage === "configure" && Boolean(file)) || (stage === "done" && Boolean(resultBlob))}
        settingsPanel={
          file && stage === "configure" ? (
            enhancedUiEnabled ? (
              <HybridModeSheetPanel
                toolSlug="compress-pdf"
                file={file}
                settings={{ level }}
                settingsPanel={
                  <CompressLevelPicker
                    level={level}
                    onLevelChange={setLevel}
                    processingContext={mode === "enhanced" ? "cloud" : "browser"}
                  />
                }
                browserDisabledReason={
                  smartRoute.recommendCloud && smartRoute.analysis?.imageHeavy
                    ? "Image-heavy PDF — Cloud compression optimizes images with Ghostscript for meaningful size reduction."
                    : null
                }
                onRunPremium={() => runEnhancedCompress()}
                onRunNormal={() => runBrowserCompress()}
              />
            ) : (
              <CompressLevelPicker level={level} onLevelChange={setLevel} processingContext="browser" />
            )
          ) : undefined
        }
        postProcessPanel={
          resultBlob ? (
            <MobilePostProcessPanel
              currentSlug="compress-pdf"
              onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
              onShare={() => void shareBlob(resultBlob, resultFilename)}
              onProcessAnother={resetWorkflow}
              downloadLabel="Download compressed PDF"
            />
          ) : undefined
        }
      >
        {failsafe.suggestCloud && enhancedUiEnabled && mode === "browser" ? (
          <p className="mb-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            {failsafe.message}
          </p>
        ) : null}

        {error ? (
          <ToolErrorState
            title="Compression failed"
            message={error}
            onRetry={() => {
              setError(null);
              processingUi.resetToFileSelected();
              if (isEnhanced) void runEnhancedCompress();
              else void runBrowserCompress();
            }}
            className="mb-3 py-6"
          />
        ) : null}

        <ToolWorkflowShell
          stage={workflowStage}
          toolSlug="compress-pdf"
          progress={stage === "processing" && !isEnhanced ? progress : undefined}
          progressLabel={stage === "processing" && !isEnhanced ? "Staging upload & compressing…" : undefined}
          processingTitle="Compressing…"
          processingSubtitle={isEnhanced ? "Optimizing in the cloud" : "Compressing in your browser"}
          processingContent={
            stage === "processing" && isEnhanced ? (
              <ProcessingStatusPanel
                phase={processingUi.phase}
                progress={premiumCloud.progress}
                cloudStatus={premiumCloud.status}
                error={error}
                onRetry={() => {
                  processingUi.resetToFileSelected();
                  setError(null);
                  setStage("configure");
                }}
                onCancel={() => {
                  premiumCloud.cancel();
                  setStage("configure");
                }}
              />
            ) : undefined
          }
          upload={
            <DropZone onFiles={handleFiles} multiple={false} label="Drop your PDF here" sublabel="One PDF — browser or cloud mode" />
          }
          configure={
            file ? (
              <div>
                <ToolUploadedFileCard file={file} onRemove={resetWorkflow} className="mb-3" />
                <p className="text-center text-xs text-muted-foreground">
                  {enhancedUiEnabled
                    ? t("premiumTier.gearModeHint", {
                        defaultValue: "Open settings (gear) for compression level and processing mode.",
                      })
                    : t("premiumTier.gearLevelHint", {
                        defaultValue: "Open settings (gear) to adjust compression level.",
                      })}
                </p>
              </div>
            ) : null
          }
          done={
            resultBlob && usedEnhancedCloud ? (
              <EnhancedToolResultPanel
                blob={resultBlob}
                filename={resultFilename}
                toolSlug="compress-pdf"
                originalBytes={file?.size}
                sourceFile={file}
                objectUrl={enhancedLifecycle.objectUrl}
                secondsLeft={enhancedLifecycle.secondsLeft}
                cloudExpired={enhancedLifecycle.cloudExpired}
                persisting={enhancedLifecycle.persisting}
                jobId={enhancedLifecycle.jobId}
                hideFooterAd={isToolWorkflowAdFree(stage)}
                onProcessAnother={resetWorkflow}
              />
            ) : resultBlob ? (
              <ToolResultPanel
                blob={resultBlob}
                filename={resultFilename}
                sourceFile={file}
                toolSlug="compress-pdf"
                executedVia="browser"
                title="Compressed PDF ready"
                hideFooterAd={isToolWorkflowAdFree(stage)}
                onProcessAnother={resetWorkflow}
              />
            ) : (
              <div />
            )
          }
        />
      </MobileToolLayout>
    </div>
  );

  const wrapped = (
    <>
      {desktopExperience}
      {page}
      <FileLimitModal
        open={validation.limitModalOpen}
        onOpenChange={validation.setLimitModalOpen}
        result={validation.limitModal}
        toolSlug="compress-pdf"
        file={file}
        settings={{ level }}
        onContinuePremium={() => void runEnhancedCompress()}
      />
      <FallbackToPremiumModal
        open={validation.fallbackOpen}
        onOpenChange={validation.setFallbackOpen}
        toolSlug="compress-pdf"
        file={file}
        settings={{ level }}
        onTryAgain={() => void runBrowserCompress()}
        onContinuePremium={() => void runEnhancedCompress()}
      />
    </>
  );

  if (enhancedUiEnabled) {
    return <HybridToolChrome toolSlug="compress-pdf">{wrapped}</HybridToolChrome>;
  }
  return wrapped;
}

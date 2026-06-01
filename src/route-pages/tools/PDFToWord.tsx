import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import DropZone from "@/components/DropZone";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import ToolSEO from "@/components/ToolSEO";
import SecurityBadge from "@/components/SecurityBadge";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { useProcess } from "@/context/ProcessContext";
import { pdfToWord, getWordFilename } from "@/tools/pdf-to-word/logic";
import { content } from "@/tools/pdf-to-word/content";
import { logToolError } from "@/utils/logger";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { isToolWorkflowAdFree, showToolSidebarAd } from "@/lib/toolAdPhase";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { HybridToolChrome } from "@/components/processing/HybridToolChrome";
import { HybridModeSheetPanel } from "@/components/processing/HybridModeSheetPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { useHybridToolWorkflow } from "@/hooks/useHybridToolWorkflow";
import { saveHybridUploadSession, newUploadSessionId } from "@/lib/processing/hybridUploadSession";
import { buildCloudJobOptions } from "@/lib/processing/cloudJobOptions";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import { ProcessingStatusPanel } from "@/components/processing/ProcessingStatusPanel";
import { FileLimitModal } from "@/components/processing/FileLimitModal";
import { FallbackToPremiumModal } from "@/components/processing/FallbackToPremiumModal";
import { useProcessingValidation } from "@/hooks/useProcessingValidation";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { useToolProcessingState } from "@/hooks/useToolProcessingState";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { premiumFlowToFile, stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { EnhancedToolResultPanel } from "@/components/history/EnhancedToolResultPanel";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { useMemoryFailsafe } from "@/hooks/useMemoryFailsafe";
import { DocumentQualityHint } from "@/components/processing/DocumentQualityHint";
import { ToolErrorState } from "@/components/tools/ToolErrorState";
import { ToolPagePremiumLayout } from "@/components/tools/ToolPagePremiumLayout";
import { ToolWorkspaceLayout } from "@/components/tools/ToolWorkspaceLayout";
import { useSmartDocumentRoute } from "@/lib/processing/useSmartDocumentRoute";
import { isCloudRunUiActive } from "@/lib/processing/cloudRunUi";
import { mapProcessingError } from "@/lib/processing/processingErrors";
import { toast } from "sonner";
import { GenericToolDesktopAdapter } from "@/components/desktop/adapters/GenericToolDesktopAdapter";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { normalizeToolStage } from "@/lib/desktop/types";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { usePremium } from "@/context/PremiumContext";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
export default function PDFToWord() {
  const { t, i18n } = useTranslation();
  const onHybridRestore = useCallback(async () => {
    setStage("ready");
    setError(null);
  }, []);
  const hybrid = useHybridToolWorkflow({
    toolSlug: "pdf-to-word",
    onRestore: onHybridRestore,
  });
  const file = hybrid.file;
  const setFile = hybrid.setFile;
  const [stage, setStage] = useState<"upload" | "ready" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const [premiumTier, setPremiumTier] = useState<PremiumProcessingTier>("standard");
  const [usedCloudConvert, setUsedCloudConvert] = useState(false);
  const { setProcessedFile } = useProcess();
  const { mode, enabled: enhancedUiEnabled, setMode } = useProcessingMode();
  const premiumCloud = usePremiumCloudRun("pdf-to-word", "PDF to Word");
  const enhancedLifecycle = premiumCloud.lifecycle;
  const isEnhanced = isCloudRunUiActive(enhancedUiEnabled, mode, {
    usedCloudConvert,
    cloudStatus: premiumCloud.status,
  });
  const usedEnhancedCloud =
    enhancedUiEnabled && stage === "done" && resultBlob !== null && usedCloudConvert;
  const failsafe = useMemoryFailsafe({
    fileSizeMB: file ? file.size / (1024 * 1024) : undefined,
  });
  const smartRoute = useSmartDocumentRoute(file, "pdf-to-word");
  const browserDisabledReason = smartRoute.shouldBlockBrowser
    ? t("premiumTier.scannedUsePro", {
        defaultValue: "Scanned PDF — use Trusted Pro for best results.",
      })
    : null;

  const { requestSignIn } = useAuthPrompt();
  const { isSignedIn } = usePremium();
  const validation = useProcessingValidation("pdf-to-word", smartRoute.analysis);
  const processingUi = useToolProcessingState({
    hasFile: Boolean(file),
    cloudStatus: premiumCloud.status,
    uploadProgress: premiumCloud.progress,
    localStage: stage === "ready" ? "configure" : stage,
  });

  usePremiumFlowRestore(
    "pdf-to-word",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      setFile(restored);
      setStage("ready");
      setError(null);
      hybrid.setModeModalOpen(false);
      const settings = flow.settings as { tier?: PremiumProcessingTier } | undefined;
      if (settings?.tier) setPremiumTier(settings.tier);
      await saveHybridUploadSession({
        sessionId: newUploadSessionId(),
        toolSlug: "pdf-to-word",
        fileName: restored.name,
        mimeType: restored.type,
        blob: restored,
        preferredMode: "enhanced",
      });
    },
    { onAutoStart: () => runEnhancedConvert() },
  );

  const stashCloudEnhanced = useCallback(
    async (tier: PremiumProcessingTier = premiumTier) => {
      if (!file) return;
      setPremiumTier(tier);
      await stashPremiumFlow({
        blob: file,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        toolSlug: "pdf-to-word",
        mode: "enhanced",
        settings: { tier },
      });
      requestSignIn({
        reason: SIGN_IN_REASON.pdfToWord,
        tone: "cloud",
        deferredAction: "premium-restore",
        toolSlug: "pdf-to-word",
        autoStart: true,
      });
    },
    [file, premiumTier, requestSignIn],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      await hybrid.acceptUpload(f, { openModeModal: false });
      setStage("ready");
      setError(null);
    },
    [hybrid],
  );

  async function runEnhancedConvert() {
    if (!file) return;
    setError(null);
    setMode("enhanced");
    const ok = await validation.validateFile(file, "enhanced");
    if (!ok) return;
    setStage("processing");
    setProgress(0);
    setUsedCloudConvert(true);
    processingUi.resetToFileSelected();
    try {
      const pages = await getPDFPageCount(file);
      const cloudOpts = buildCloudJobOptions("pdf-to-word", smartRoute.analysis ?? null, premiumTier) ?? {};
      const { blob, filename: cloudName } = await premiumCloud.runPremium(file, pages, cloudOpts);
      const filename = cloudName.endsWith(".docx")
        ? cloudName
        : getWordFilename(file).replace(/\.rtf$/i, ".docx");
      setProcessedFile({
        blob,
        filename,
        tool: "PDF to Word",
        toolSlug: "pdf-to-word",
        originalSize: file.size,
        processedSize: blob.size,
      });
      setResultBlob(blob);
      setResultFilename(filename);
      setStage("done");
    } catch (err) {
      const mapped = mapProcessingError(err);
      logToolError("pdf-to-word", "enhanced_convert", err, { recoverable: true, suppressToast: true });
      setError(mapped.message);
      toast.error(mapped.message);
      processingUi.markFailed();
      setStage("ready");
    }
  }

  async function runBrowserConvert() {
    if (!file) return;
    setError(null);
    const ok = await validation.validateFile(file, "browser");
    if (!ok) return;
    setStage("processing");
    setProgress(0);
    setUsedCloudConvert(false);
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
          timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 8, 95))), 250);
          try {
            const result = await pdfToWord(file);
            setProgress(100);
            const blob = new Blob([result as BlobPart], { type: "application/rtf" });
            const filename = getWordFilename(file);
            setProcessedFile({
              blob,
              filename,
              tool: "PDF to Word",
              toolSlug: "pdf-to-word",
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
      logToolError("pdf-to-word", "convert_processing", err, { recoverable: true, suppressToast: true });
      validation.showFallback();
      setError(null);
      setStage("ready");
    }
  }

  const runFromSelectedMode = useCallback(async () => {
    if (mode === "browser") {
      await runBrowserConvert();
      return;
    }
    if (!isSignedIn) {
      await stashCloudEnhanced(premiumTier);
      return;
    }
    await runEnhancedConvert();
  }, [mode, isSignedIn, premiumTier, runBrowserConvert, runEnhancedConvert, stashCloudEnhanced]);

  const resetWorkflow = () => {
    void hybrid.clearSession();
    enhancedLifecycle.reset();
    setUsedCloudConvert(false);
    setFile(null);
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

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
    await safeDownloadBlob(resultBlob, resultFilename || "converted.docx");
  }, [resultBlob, resultFilename]);

  const desktopStage = normalizeToolStage(stage);

  const desktopExperience = (
    <GenericToolDesktopAdapter
      toolSlug="pdf-to-word"
      stage={desktopStage}
      file={file}
      progress={progress}
      isEnhanced={isEnhanced}
      cloudProgress={premiumCloud.progress}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={previewObjectUrl}
      onFiles={handleFiles}
      browserDisabledReason={browserDisabledReason}
      onProcessSelection={({ tier, mode: pickMode }) => {
        if (pickMode === "browser") {
          void runBrowserConvert();
          return;
        }
        setPremiumTier(tier);
        setMode("enhanced");
        if (!isSignedIn) {
          void stashCloudEnhanced(tier);
          return;
        }
        void runEnhancedConvert();
      }}
      enhancedUiEnabled={enhancedUiEnabled}
      isSignedIn={isSignedIn}
      cloudStatus={premiumCloud.status}
      errorMessage={error}
      onRequestSignIn={() =>
        requestSignIn({ reason: SIGN_IN_REASON.pdfToWord, tone: "cloud" })
      }
      onDeferredCloudStart={(tier) => void stashCloudEnhanced(tier)}
      onReset={resetWorkflow}
      onDownload={handleDesktopDownload}
      processLabel="Convert to Word"
    />
  );

  const workspacePanel = (
    <>
      {stage === "upload" && (
        <div className="flex min-h-[min(48vh,440px)] touch-pan-y flex-col justify-center overflow-y-auto overscroll-y-auto">
          <DropZone
            onFiles={handleFiles}
            multiple={false}
            label="Drop your PDF here"
            sublabel="Extracts all text into a Word-compatible file"
          />
        </div>
      )}
      {stage === "ready" && file ? (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <ToolInputPreview
            file={file}
            label="Your PDF"
            previewLayout="paged"
            className="mx-auto min-h-0 w-full max-w-none flex-1"
          />
          <button
            type="button"
            data-testid="button-convert-pdf"
            onClick={() => void (enhancedUiEnabled ? runFromSelectedMode() : runBrowserConvert())}
            className={TOOL_PRIMARY_BTN}
          >
            <FileText className="h-4 w-4" />
            Convert to Word
          </button>
        </div>
      ) : null}
      {(stage === "processing" || stage === "done") && file ? (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <ToolInputPreview
            file={file}
            label="Source PDF"
            previewLayout="paged"
            className="mx-auto min-h-0 w-full max-w-none flex-1"
          />
        </div>
      ) : null}
    </>
  );

  const optionsPanel = (
    <div className="space-y-4">
      <SecurityBadge />
      <ToolWorkflowActions onReset={resetWorkflow} resetDisabled={stage === "processing"} />

      {failsafe.suggestCloud && enhancedUiEnabled && mode === "browser" ? (
        <p className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">{failsafe.message}</p>
      ) : null}

      {file && stage === "ready" ? (
        <>
          <DocumentQualityHint file={file} toolSlug="pdf-to-word" />
          {enhancedUiEnabled ? (
            <HybridModeSheetPanel
              toolSlug="pdf-to-word"
              file={file}
              browserDisabledReason={browserDisabledReason}
              onTierSelect={(tier, pickMode) => {
                setPremiumTier(tier);
                setMode(pickMode);
              }}
              onRunPremium={() => runEnhancedConvert()}
              onRunNormal={() => runBrowserConvert()}
            />
          ) : null}
        </>
      ) : null}

      {error ? (
        <ToolErrorState
          title="Conversion failed"
          message={error}
          onRetry={() => {
            setError(null);
            processingUi.resetToFileSelected();
            setStage("ready");
          }}
          suggestions={[
            "Try Trusted Cloud mode for scanned PDFs",
            "Unlock password-protected PDFs first",
            "Use a smaller file if the upload timed out",
          ]}
          className="py-8"
        />
      ) : null}

      {stage === "processing" && (isEnhanced || usedCloudConvert || premiumCloud.status !== "idle") ? (
          <ProcessingStatusPanel
            key="processing-enhanced"
            phase={processingUi.phase}
            progress={premiumCloud.progress}
            cloudStatus={premiumCloud.status}
            error={error}
            onRetry={() => {
              processingUi.resetToFileSelected();
              setError(null);
              setStage("ready");
            }}
            onCancel={() => {
              premiumCloud.cancel();
              setStage("ready");
            }}
          />
        ) : null}
        {stage === "processing" && !isEnhanced ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6 h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.3s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-foreground">Extracting text…</p>
            <p className="text-sm text-muted-foreground">Reading all pages in your browser</p>
          </div>
        ) : null}

        {stage === "done" && resultBlob && usedEnhancedCloud ? (
          <div>
            <EnhancedToolResultPanel
              blob={resultBlob}
              filename={resultFilename}
              toolSlug="pdf-to-word"
              originalBytes={file?.size}
              sourceFile={file}
              objectUrl={enhancedLifecycle.objectUrl}
              secondsLeft={enhancedLifecycle.secondsLeft}
              cloudExpired={enhancedLifecycle.cloudExpired}
              persisting={enhancedLifecycle.persisting}
              jobId={enhancedLifecycle.jobId}
              onProcessAnother={() => {
                enhancedLifecycle.reset();
                setFile(null);
                setResultBlob(null);
                setResultFilename("");
                setStage("upload");
                setProcessedFile(null);
              }}
            />
          </div>
        ) : null}
        {stage === "done" && resultBlob && !usedEnhancedCloud ? (
          <div>
            <ToolResultPanel
              blob={resultBlob}
              filename={resultFilename}
              sourceFile={file}
              toolSlug="pdf-to-word"
              executedVia="browser"
              title="Converted document"
              onProcessAnother={() => {
                setFile(null);
                setResultBlob(null);
                setResultFilename("");
                setStage("upload");
                setProcessedFile(null);
              }}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              RTF preview may not render in all browsers — use Download to open in Word or another editor.
            </p>
          </div>
        ) : null}
    </div>
  );

  const mobilePage = (
    <MobileToolLayout
      slug="pdf-to-word"
      toolLabel={content.hero.title}
      title={content.hero.title}
      workflowStep={stage === "upload" ? "upload" : stage === "ready" ? "configure" : stage === "processing" ? "process" : "done"}
      settingsPanel={file && stage === "ready" ? optionsPanel : undefined}
      processButton={
        stage === "ready" && file ? (
          <button
            type="button"
            data-testid="button-convert-pdf"
            onClick={() => void (enhancedUiEnabled ? runFromSelectedMode() : runBrowserConvert())}
            className={TOOL_PRIMARY_BTN}
          >
            <FileText className="h-4 w-4" />
            Convert to Word
          </button>
        ) : null
      }
      postProcessPanel={
        resultBlob && stage === "done" ? (
          <MobilePostProcessPanel
            currentSlug="pdf-to-word"
            onDownload={() => void handleDesktopDownload()}
            onProcessAnother={resetWorkflow}
          />
        ) : undefined
      }
    >
    <ToolPagePremiumLayout
      slug="pdf-to-word"
      toolName={content.hero.title}
      maxWidth="6xl"
    >
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="pdf-to-word" lang={i18n.language} />
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
          <FileText className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{content.hero.title}</h1>
          <p className="text-xs text-muted-foreground">{content.hero.subtitle}</p>
        </div>
      </div>

      <ToolWorkspaceLayout
        workspace={workspacePanel}
        optionsTitle={content.hero.title}
        optionsDescription={content.hero.subtitle}
        options={optionsPanel}
        steps={content.steps.map((step) => ({
          number: String(step.number),
          title: step.title,
          description: step.description,
        }))}
        hideAds={isToolWorkflowAdFree(stage)}
        showSidebarAd={showToolSidebarAd(stage)}
      />

    </ToolPagePremiumLayout>
    </MobileToolLayout>
  );

  const split = <ToolPageSplit desktop={desktopExperience} mobile={mobilePage} />;

  if (enhancedUiEnabled) {
    return (
      <HybridToolChrome toolSlug="pdf-to-word">
        {split}
        <FileLimitModal
          open={validation.limitModalOpen}
          onOpenChange={validation.setLimitModalOpen}
          result={validation.limitModal}
          toolSlug="pdf-to-word"
          file={file}
          onContinuePremium={() => void runEnhancedConvert()}
        />
        <FallbackToPremiumModal
          open={validation.fallbackOpen}
          onOpenChange={validation.setFallbackOpen}
          toolSlug="pdf-to-word"
          file={file}
          onTryAgain={() => void runBrowserConvert()}
          onContinuePremium={() => void runEnhancedConvert()}
        />
      </HybridToolChrome>
    );
  }
  return split;
}

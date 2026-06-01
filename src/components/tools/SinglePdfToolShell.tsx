"use client";

import { useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { GenericToolDesktopAdapter } from "@/components/desktop/adapters/GenericToolDesktopAdapter";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { normalizeToolStage } from "@/lib/desktop/types";
import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import { useHydrated } from "@/hooks/useHydrated";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { AlertCircle, FileText } from "lucide-react";
import { ToolErrorState } from "@/components/tools/ToolErrorState";
import PDFThumbnail from "@/components/PDFThumbnail";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { toast } from "sonner";
import ToolSEO from "@/components/ToolSEO";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { StickyToolBreadcrumbs } from "@/components/tools/StickyToolBreadcrumbs";
import { ToolQuickSwitcher } from "@/components/tools/ToolQuickSwitcher";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { ProcessingCinematic } from "@/components/tools/ProcessingCinematic";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { isToolWorkflowAdFree } from "@/lib/toolAdPhase";
import { conversionErrorMessage } from "@/tools/toolPipeline/registry";
import { useAuthPrompt, stashAuthIntent } from "@/context/AuthPromptContext";
import { useLocation } from "wouter";
import { requestUpgradeAfterLimit } from "@/lib/billing/upgradeFlow";
import { stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { isClientQaModeActive } from "@/lib/qa/isQaMode";
import { HybridModeSheetPanel } from "@/components/processing/HybridModeSheetPanel";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { FileLimitModal } from "@/components/processing/FileLimitModal";
import { FallbackToPremiumModal } from "@/components/processing/FallbackToPremiumModal";
import { useProcessingValidation } from "@/hooks/useProcessingValidation";
import { isHybridTool, requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";
import { ProcessingStatusPanel } from "@/components/processing/ProcessingStatusPanel";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { useToolProcessingState } from "@/hooks/useToolProcessingState";
import { EnhancedToolResultPanel } from "@/components/history/EnhancedToolResultPanel";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { deriveOutputFilename } from "@/lib/files/deriveOutputFilename";
import { useMemoryFailsafe } from "@/hooks/useMemoryFailsafe";
import { useTranslation } from "react-i18next";
import { useHybridToolWorkflow } from "@/hooks/useHybridToolWorkflow";
import { recordBrowserUsage } from "@/lib/usage/recordBrowserUsage";
import { saveHybridUploadSession, newUploadSessionId } from "@/lib/processing/hybridUploadSession";
import { useSmartDocumentRoute } from "@/lib/processing/useSmartDocumentRoute";
import { buildCloudJobOptions } from "@/lib/processing/cloudJobOptions";
import { isCloudRunUiActive } from "@/lib/processing/cloudRunUi";
import { mapProcessingError } from "@/lib/processing/processingErrors";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { UploadSuccessStep } from "@/components/tools/UploadSuccessStep";
import { ContinueSessionBanner, saveToolSession } from "@/components/tools/ContinueSessionBanner";

type Stage = "upload" | "ready" | "processing" | "done";

type Props = {
  slug: string;
  toolLabel: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconClassName?: string;
  steps: Array<{ number: string; title: string; description: string }>;
  lang: string;
  configurePanel?: (file: File) => ReactNode;
  canProcess?: (file: File) => boolean;
  onProcess: (file: File) => Promise<{ blob: Blob; filename: string }>;
  /** When true, shows browser vs enhanced mode selector and cloud path. */
  supportsEnhanced?: boolean;
  /** OCR-only: cloud workers required; no browser processing or Normal mode. */
  cloudProcessingOnly?: boolean;
  cloudOptions?: () => Record<string, unknown>;
  accept?: string;
  dropLabel?: string;
  dropSublabel?: string;
  multiple?: boolean;
};

export function SinglePdfToolShell({
  slug,
  toolLabel,
  title,
  subtitle,
  icon,
  iconClassName = "bg-primary/10",
  steps,
  lang,
  configurePanel,
  canProcess,
  onProcess,
  supportsEnhanced = false,
  cloudProcessingOnly = false,
  cloudOptions,
  accept = ".pdf,application/pdf",
  dropLabel,
  dropSublabel,
  multiple = false,
}: Props) {
  const { t } = useTranslation();
  const hydrated = useHydrated();
  const isLgDesktop = useIsLgDesktop();
  const {
    mode,
    setMode,
    enabled: enhancedUiEnabled,
    cloudInfraReady,
    cloudInfraMessage,
    cloudInfraLoading,
    usage,
  } = useProcessingMode();
  const { canUse, isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const [, navigate] = useLocation();
  const premiumCloud = usePremiumCloudRun(slug, toolLabel);
  const enhancedLifecycle = premiumCloud.lifecycle;
  const cloudOnly = cloudProcessingOnly || requiresCloudOnlyProcessing(slug);
  const usesCloudPipeline =
    cloudOnly || (supportsEnhanced && enhancedUiEnabled && mode === "enhanced");
  const [usedCloudRun, setUsedCloudRun] = useState(false);
  const isEnhanced =
    cloudOnly ||
    isCloudRunUiActive(enhancedUiEnabled, mode, {
      usedCloudConvert: usedCloudRun,
      cloudStatus: premiumCloud.status,
    });
  const qaMode = isClientQaModeActive();
  const creditsReserved = usage?.credits?.reserved ?? 0;
  const premiumQuotaExhausted =
    !qaMode &&
    usage?.enabled &&
    usage.enhancedRemaining !== undefined &&
    usage.enhancedRemaining <= 0 &&
    creditsReserved <= 0;
  const hybrid = useHybridToolWorkflow({
    toolSlug: slug,
    onRestore: async () => {
      setStage("ready");
      setError(null);
    },
  });
  const file = hybrid.file;
  const setFile = hybrid.setFile;
  const setModeModalOpen = hybrid.setModeModalOpen;
  const [stage, setStage] = useState<Stage>("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const [premiumTier, setPremiumTier] = useState<PremiumProcessingTier>("standard");
  const [uploadGateOpen, setUploadGateOpen] = useState(false);
  const [uploadGateMessage, setUploadGateMessage] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const { setProcessedFile } = useProcess();
  const validation = useProcessingValidation(slug);
  const failsafe = useMemoryFailsafe({
    fileSizeMB: file ? file.size / (1024 * 1024) : undefined,
  });
  const hybridActive = supportsEnhanced || isHybridTool(slug) || cloudProcessingOnly;
  const smartRoute = useSmartDocumentRoute(file, slug, {
    autoSelectCloud: enhancedUiEnabled && (cloudOnly || hybridActive),
  });
  const processingUi = useToolProcessingState({
    hasFile: Boolean(file),
    cloudStatus: premiumCloud.status,
    uploadProgress: premiumCloud.progress,
    localStage: stage === "ready" ? "configure" : stage,
  });

  usePremiumFlowRestore(
    slug,
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      setFile(restored);
      setStage("ready");
      setError(null);
      setModeModalOpen(false);
      await saveHybridUploadSession({
        sessionId: newUploadSessionId(),
        toolSlug: slug,
        fileName: restored.name,
        mimeType: restored.type,
        blob: restored,
        preferredMode: "enhanced",
      });
    },
    { onAutoStart: () => void (cloudOnly ? runCloudPrimary() : runEnhanced()) },
  );

  const usedEnhancedCloud =
    usesCloudPipeline && enhancedUiEnabled && stage === "done" && enhancedLifecycle.localBlob !== null;

  const handleFiles = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      const totalMB = f.size / (1024 * 1024);
      const check = canUse(1, totalMB, slug, { largestFileMB: totalMB });
      if (!check.allowed) {
        if (check.suggestCloud) {
          setPendingUpload(f);
          setUploadGateMessage(check.reason ?? null);
          setUploadGateOpen(true);
          setError(null);
          return;
        }
        setError(check.reason!);
        logToolError(slug, "upload_blocked", new Error(check.reason ?? "blocked"));
        return;
      }
      if (hybridActive) {
        await hybrid.acceptUpload(f, { openModeModal: false });
        setStage("ready");
        setResultBlob(null);
        return;
      }
      setFile(f);
      setStage("ready");
      setError(null);
      setResultBlob(null);
    },
    [canUse, hybridActive, slug, hybrid],
  );

  const reset = () => {
    void hybrid.clearSession();
    enhancedLifecycle.reset();
    setUsedCloudRun(false);
    setFile(null);
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  async function runCloudPrimary() {
    if (!file) return;
    setError(null);

    if (cloudInfraLoading) {
      setError(
        t("processing.cloudChecking", {
          defaultValue: "Checking cloud processing availability…",
        }),
      );
      return;
    }

    if (!enhancedUiEnabled && !cloudInfraReady) {
      setError(
        cloudInfraMessage ??
          t("processing.cloudUnavailable", {
            defaultValue:
              "Cloud processing is not available. On Vercel set REDIS_URL (public Railway URL), S3/R2 keys, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_ENHANCED_ENABLED=true — then redeploy.",
          }),
      );
      return;
    }

    if (!isSignedIn) {
      const stashed = await stashPremiumFlow({
        blob: file,
        fileName: file.name,
        mimeType: file.type,
        toolSlug: slug,
        mode: "enhanced",
        settings: cloudOptions?.(),
      });
      if (!stashed) {
        toast.error(t("execution.stashFailed"));
        return;
      }
      stashAuthIntent({
        returnPath:
          typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
        desiredMode: "enhanced",
        toolSlug: slug,
        autoStart: true,
        deferredAction: "premium-restore",
        reason: t("execution.cloudSignInReason"),
      });
      requestSignIn({
        reason: t("execution.cloudSignInReason"),
        tone: "cloud",
        deferredAction: "premium-restore",
        toolSlug: slug,
      });
      return;
    }

    if (premiumQuotaExhausted) {
      requestUpgradeAfterLimit({
        isSignedIn,
        requestSignIn,
        navigate,
        reason: t("execution.upgradeRequired"),
      });
      return;
    }

    setMode("enhanced");
    await runEnhanced();
  }

  async function runEnhanced() {
    if (!file) return;
    setMode("enhanced");
    const ok = await validation.validateFile(file, "enhanced");
    if (!ok) return;
    setStage("processing");
    setProgress(0);
    setError(null);
    setUsedCloudRun(true);
    processingUi.resetToFileSelected();
    try {
      let pages = 1;
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        try {
          pages = await getPDFPageCount(file);
        } catch {
          pages = 1;
        }
      }
      const opts = {
        ...(buildCloudJobOptions(slug, smartRoute.analysis ?? null, premiumTier) ?? {}),
        ...(cloudOptions?.() ?? {}),
      };
      const { blob, filename } = await premiumCloud.runPremium(file, pages, opts);
      setProcessedFile({
        blob,
        filename,
        tool: toolLabel,
        toolSlug: slug,
        originalSize: file.size,
        processedSize: blob.size,
      });
      setResultBlob(blob);
      setResultFilename(filename);
      setStage("done");
    } catch (err) {
      const mapped = mapProcessingError(err);
      logToolError(slug, "enhanced_processing", err, { recoverable: true, suppressToast: true });
      setError(mapped.message);
      toast.error(mapped.message);
      processingUi.markFailed();
      setStage("ready");
    }
  }

  async function runBrowserOnly() {
    if (!file) return;
    saveToolSession(slug, toolLabel);
    if (cloudOnly) {
      await runCloudPrimary();
      return;
    }
    if (canProcess && !canProcess(file)) return;
    if (hybridActive) {
      const ok = await validation.validateFile(file, "browser");
      if (!ok) return;
    }
    setStage("processing");
    setProgress(0);
    setError(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    const runLocalWork = async () => {
      timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 8, 95))), 200);
      const { blob, filename } = await onProcess(file);
      setProgress(100);
      setProcessedFile({
        blob,
        filename,
        tool: toolLabel,
        toolSlug: slug,
        originalSize: file.size,
        processedSize: blob.size,
      });
      setResultBlob(blob);
      setResultFilename(filename);
      setStage("done");
      if (hybrid.sessionId) {
        void recordBrowserUsage(slug, hybrid.sessionId);
      }
    };
    try {
      const directLocal = hybridActive && file.size <= 20 * 1024 * 1024;
      if (directLocal) {
        await runLocalWork();
      } else {
        await runTieredThenCleanup(
          [file],
          {
            onProgress: (u, t) => {
              const safe = Math.max(t, 1);
              setProgress((p) => nextProgress(p, Math.round((u / safe) * 70)));
            },
          },
          runLocalWork,
        );
      }
    } catch (err) {
      const msg = conversionErrorMessage(err, t);
      logToolError(slug, "processing", err, { recoverable: true, suppressToast: true });
      setError(msg);
      setStage("ready");
    } finally {
      if (timer) clearInterval(timer);
    }
  }

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

  const handleDesktopDownload = useCallback(() => {
    if (!resultBlob) return;
    void safeDownloadBlob(resultBlob, resultFilename || "output.pdf");
  }, [resultBlob, resultFilename]);

  const desktopStage = normalizeToolStage(stage);

  const desktopExperience = (
    <GenericToolDesktopAdapter
      toolSlug={slug}
      stage={desktopStage}
      file={file}
      progress={isEnhanced ? premiumCloud.progress : progress}
      isEnhanced={isEnhanced}
      cloudProgress={premiumCloud.progress}
      cloudStatus={premiumCloud.status}
      errorMessage={error}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={previewObjectUrl}
      onFiles={handleFiles}
      onProcessSelection={({ tier, mode: pickMode }) => {
        setPremiumTier(tier);
        setModeModalOpen(false);
        if (pickMode === "browser") void runBrowserOnly();
        else if (cloudOnly) void runCloudPrimary();
        else {
          setMode("enhanced");
          void runEnhanced();
        }
      }}
      browserDisabledReason={
        smartRoute.shouldBlockBrowser
          ? t("premiumTier.scannedUsePro", {
              defaultValue: "Scanned PDF — use Trusted Pro for best results.",
            })
          : null
      }
      enhancedUiEnabled={Boolean(hybridActive && enhancedUiEnabled)}
      isSignedIn={isSignedIn}
      onRequestSignIn={() =>
        requestSignIn({
        reason: t("execution.cloudSignInReason"),
        tone: "cloud",
        deferredAction: "premium-restore",
          toolSlug: slug,
        })
      }
      onReset={reset}
      onDownload={handleDesktopDownload}
      showBrowser={!cloudOnly}
      showPremium={hybridActive || cloudOnly}
      extraOptions={file && configurePanel ? configurePanel(file) : undefined}
      processLabel={cloudOnly ? toolLabel : t("toolWorkspace.process", { defaultValue: "Process PDF" })}
    />
  );

  const sharedModals = (
    <>
      <FileLimitModal
        open={validation.limitModalOpen || uploadGateOpen}
        onOpenChange={(open) => {
          validation.setLimitModalOpen(open);
          setUploadGateOpen(open);
          if (!open) setPendingUpload(null);
        }}
        result={
          validation.limitModal ??
          (uploadGateMessage
            ? {
                ok: false as const,
                code: "FILE_TOO_LARGE_NORMAL" as const,
                message: uploadGateMessage,
                suggestPremium: true,
                suggestSignIn: !isSignedIn,
              }
            : null)
        }
        toolSlug={slug}
        file={file ?? pendingUpload}
        onContinuePremium={async () => {
          const f = pendingUpload ?? file;
          if (f && hybridActive) {
            await hybrid.acceptUpload(f, { openModeModal: false });
            setStage("ready");
            setPendingUpload(null);
            setUploadGateOpen(false);
          }
          void runEnhanced();
        }}
      />
      <FallbackToPremiumModal
        open={validation.fallbackOpen}
        onOpenChange={validation.setFallbackOpen}
        toolSlug={slug}
        file={file}
        onTryAgain={
          cloudOnly || mode === "enhanced" ? undefined : () => void runBrowserOnly()
        }
        onContinuePremium={() => void runEnhanced()}
      />
    </>
  );

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload"
      ? "upload"
      : stage === "ready"
        ? "configure"
        : stage === "processing"
          ? "process"
          : "done";

  const mobileProcessButton =
    stage === "ready" && file ? (
      <button
        type="button"
        onClick={() => {
          if (hybridActive && enhancedUiEnabled) {
            if (mode === "enhanced") void (cloudOnly ? runCloudPrimary() : runEnhanced());
            else void runBrowserOnly();
            return;
          }
          void runBrowserOnly();
        }}
        className={TOOL_PRIMARY_BTN}
      >
        {cloudOnly && !isSignedIn
          ? t("conversion.deferred.ctaCloudGuest", {
              defaultValue: "Continue with Google — Run Turbo Cloud",
            })
          : cloudOnly
            ? toolLabel
            : t("toolWorkspace.process", { defaultValue: "Process PDF" })}
      </button>
    ) : null;

  const mobileContent = (
    <MobileToolLayout
      slug={slug}
      toolLabel={toolLabel}
      title={title}
      workflowStep={mobileWorkflowStep}
      hideConfigureStep={!configurePanel}
      settingsPanel={
        file && hybridActive && enhancedUiEnabled ? (
          <HybridModeSheetPanel
            toolSlug={slug}
            file={file}
            settingsPanel={configurePanel ? configurePanel(file) : undefined}
            browserDisabledReason={
              smartRoute.shouldBlockBrowser
                ? t("premiumTier.scannedUsePro", {
                    defaultValue: "Scanned PDF — use Trusted Pro for best results.",
                  })
                : null
            }
            onTierSelect={(tier, pickMode) => {
              setPremiumTier(tier);
              setMode(pickMode);
            }}
            onRunPremium={() => (cloudOnly ? runCloudPrimary() : runEnhanced())}
            onRunNormal={() => runBrowserOnly()}
          />
        ) : file && configurePanel ? (
          configurePanel(file)
        ) : undefined
      }
      postProcessPanel={
        stage === "done" && resultBlob ? (
          <MobilePostProcessPanel
            currentSlug={slug}
            onProcessAnother={reset}
            onDownload={() => void safeDownloadBlob(resultBlob, resultFilename || "output.pdf")}
            onShare={() => void shareBlob(resultBlob, resultFilename || "output.pdf")}
            downloadLabel={t("toolWorkspace.download", { defaultValue: "Download" })}
          />
        ) : undefined
      }
      autoOpenSettings={(stage === "ready" && Boolean(file)) || (stage === "done" && Boolean(resultBlob))}
      processButton={mobileProcessButton}
    >
      <ToolSEO title={title} description={subtitle} slug={slug} lang={lang} />
      <ContinueSessionBanner currentSlug={slug} />
      <StickyToolBreadcrumbs toolName={title} slug={slug} />

      <div className="flex min-h-[70dvh] flex-col">

      {error && stage !== "processing" ? (
        <ToolErrorState
          title="Processing failed"
          message={error}
          onRetry={() => {
            setError(null);
            processingUi.resetToFileSelected();
            if (file && (isEnhanced || cloudProcessingOnly)) void runEnhanced();
            else if (file) void runBrowserOnly();
          }}
          className="mb-4 py-8"
        />
      ) : null}

      {(stage === "upload" || stage === "ready") && (
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <ToolUploadSlot
              files={file ? [file] : []}
              onFiles={handleFiles}
              multiple={multiple}
              accept={accept}
              label={dropLabel ?? t("toolWorkspace.dropLabel", { defaultValue: "Select PDF file" })}
              sublabel={dropSublabel ?? t("toolWorkspace.dropSub", { defaultValue: "or drop PDF here" })}
              onRemoveFile={reset}
              className="w-full"
            />
            {isLgDesktop && file ? (
              <UploadSuccessStep filename={file.name} fileSize={file.size} currentSlug={slug} />
            ) : null}
          </div>
        )}
        {stage === "processing" && (isEnhanced || cloudProcessingOnly || premiumCloud.status !== "idle") ? (
          <ProcessingStatusPanel
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
        {stage === "processing" && !isEnhanced && !cloudProcessingOnly ? (
          <div className="flex flex-col items-center">
            <ProcessingCinematic progress={progress} slug={slug} className="py-8" />
          </div>
        ) : null}
        {stage === "done" && resultBlob && usedEnhancedCloud ? (
          <div>
            <EnhancedToolResultPanel
              blob={resultBlob}
              filename={resultFilename}
              toolSlug={slug}
              originalBytes={file?.size}
              sourceFile={file}
              objectUrl={enhancedLifecycle.objectUrl}
              secondsLeft={enhancedLifecycle.secondsLeft}
              cloudExpired={enhancedLifecycle.cloudExpired}
              persisting={enhancedLifecycle.persisting}
              jobId={enhancedLifecycle.jobId}
              onProcessAnother={reset}
              hideFooterAd={isToolWorkflowAdFree(stage)}
            />
          </div>
        ) : null}
        {stage === "done" && resultBlob && !usedEnhancedCloud ? (
          <div>
            <ToolResultPanel
              blob={resultBlob}
              filename={resultFilename}
              sourceFile={file}
              toolSlug={slug}
              executedVia="browser"
              actionsPlacement="rail"
              onProcessAnother={reset}
            />
          </div>
        ) : null}

      <ToolQuickSwitcher slug={slug} variant="horizontal" className="mt-6" />
      </div>
    </MobileToolLayout>
  );

  return (
    <>
      <ToolRenderErrorBoundary onReset={reset}>
        <ToolPageSplit desktop={desktopExperience} mobile={mobileContent} />
      </ToolRenderErrorBoundary>
      {sharedModals}
    </>
  );
}

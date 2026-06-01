import { useEffect, useState, useCallback, useMemo } from "react";
import { Redirect, useRoute } from "wouter";
import { AlertCircle, ShieldCheck, CloudDownload, Loader2 } from "lucide-react";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import AdContainer from "@/components/AdContainer";
import ToolSEO from "@/components/ToolSEO";
import { DocumentAuditorPanel } from "@/components/trustShield/DocumentAuditorPanel";
import { TrustShieldPrivacyToggle } from "@/components/trustShield/TrustShieldPrivacyToggle";
import { TrustShieldPrivacyNotice } from "@/components/trustShield/TrustShieldPrivacyNotice";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { ToolPagePremiumLayout } from "@/components/tools/ToolPagePremiumLayout";
import { logToolError, trackInteraction } from "@/utils/logger";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { findToolBySlug, getSecurityBadgeText } from "../../../constants/tools";
import { resolveCanonicalToolPath } from "@/lib/seo/localeSlugAliases";
import { isLocaleCode } from "@/lib/seo/site";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { zipSync } from "fflate";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { isToolWorkflowAdFree, showToolSidebarAd } from "@/lib/toolAdPhase";
import { usePremium } from "@/context/PremiumContext";
import { showAuthPremiumMarketingUi } from "@/lib/featureFlags";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useProcess } from "@/context/ProcessContext";
import {
  getToolPipelineConfig,
  processToolOutputSafe,
  withMinimumDuration,
  conversionErrorMessage,
  MIN_PROCESSING_DURATION_MS,
} from "@/tools/toolPipeline/registry";
import { HybridToolChrome } from "@/components/processing/HybridToolChrome";
import { CloudOnlyToolChrome } from "@/components/processing/CloudOnlyToolChrome";
import { HybridModeSheetPanel } from "@/components/processing/HybridModeSheetPanel";
import {
  isCloudOnlyTool,
  isHybridTool,
  requiresCloudOnlyProcessing,
  toolSupportsCloudProcessing,
} from "@/lib/processing/toolProfiles";
import { isEnhancedProcessingEnabled } from "@/lib/featureFlags";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { useProcessingValidation } from "@/hooks/useProcessingValidation";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { ProcessingStatusPanel } from "@/components/processing/ProcessingStatusPanel";
import { useToolProcessingState } from "@/hooks/useToolProcessingState";
import { mapProcessingError } from "@/lib/processing/processingErrors";
import { FileLimitModal } from "@/components/processing/FileLimitModal";
import { FallbackToPremiumModal } from "@/components/processing/FallbackToPremiumModal";
import { useHybridToolWorkflow } from "@/hooks/useHybridToolWorkflow";
import { recordBrowserUsage } from "@/lib/usage/recordBrowserUsage";
import { DocumentQualityHint } from "@/components/processing/DocumentQualityHint";
import { useSmartDocumentRoute } from "@/lib/processing/useSmartDocumentRoute";
import { buildCloudJobOptions } from "@/lib/processing/cloudJobOptions";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import { GenericToolDesktopAdapter } from "@/components/desktop/adapters/GenericToolDesktopAdapter";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { normalizeToolStage } from "@/lib/desktop/types";
import { usePdfWorkerCleanup } from "@/hooks/usePdfWorker";

interface ProcessedFile {
  name: string;
  blob: Blob;
}

async function createZip(files: ProcessedFile[]) {
  const entries: Record<string, Uint8Array> = {};

  for (const item of files) {
    const arrayBuffer = await item.blob.arrayBuffer();
    entries[item.name] = new Uint8Array(arrayBuffer);
  }

  const zipBytes = zipSync(entries, { level: 3 }) as Uint8Array;
  const zipBuffer = new ArrayBuffer(zipBytes.byteLength);
  new Uint8Array(zipBuffer).set(zipBytes);
  return new Blob([zipBuffer], { type: "application/zip" });
}

const DEDICATED_STUDENT_ROUTES: Record<string, string> = {
  "document-scanner": "/document-scanner",
  "photo-resizer": "/photo-resizer",
  "resume-builder": "/resume-builder",
  "word-to-pdf": "/word-to-pdf",
};

export default function ToolPage() {
  usePdfWorkerCleanup();
  const { t, i18n } = useTranslation();
  const [, params] = useRoute("/:toolId");
  const rawSlug = params?.toolId || "";
  const loc = isLocaleCode(i18n.language) ? i18n.language : "en";
  const slug = resolveCanonicalToolPath(loc, rawSlug) ?? rawSlug;
  const dedicatedRoute = DEDICATED_STUDENT_ROUTES[slug];
  const tool = findToolBySlug(slug, t);
  const toolConfig = getToolPipelineConfig(slug);
  const SECURITY_BADGE_TEXT = getSecurityBadgeText(t);
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<"upload" | "ready" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ blob: Blob; filename: string; fileCount: number } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [premiumTier, setPremiumTier] = useState<PremiumProcessingTier>("standard");
  const { canUse, getLimits, isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const { setProcessedFile } = useProcess();
  const { mode, setMode, enabled: enhancedUiEnabled } = useProcessingMode();
  const validation = useProcessingValidation(slug);
  const premiumCloud = usePremiumCloudRun(slug, tool?.label ?? "PDF Tool");
  const cloudCapable = toolSupportsCloudProcessing(slug);
  const cloudOnlyActive = isCloudOnlyTool(slug) && cloudCapable;
  const isEnhanced =
    enhancedUiEnabled &&
    cloudCapable &&
    files.length === 1 &&
    (mode === "enhanced" || cloudOnlyActive);
  const processingUi = useToolProcessingState({
    hasFile: files.length > 0,
    cloudStatus: premiumCloud.status,
    uploadProgress: premiumCloud.progress,
    localStage: stage === "ready" ? "configure" : stage,
  });
  const hideWorkflowAds = isToolWorkflowAdFree(stage);
  const showSidebarAd = showToolSidebarAd(stage);

  useEffect(() => {
    setFiles([]);
    setStage("upload");
    setProgress(0);
    setError(null);
    setLastResult(null);
  }, [slug]);

  useEffect(() => {
    if (cloudOnlyActive) setMode("enhanced");
  }, [cloudOnlyActive, setMode]);

  const toolLabel = tool?.label ?? "PDF Tool";
  const metaDescription = t("toolPage.secureFast", { tool: toolLabel });

  const accepts = toolConfig?.accept ?? tool?.accept ?? ".pdf,application/pdf";
  const multiple = toolConfig?.multiple ?? tool?.multiple ?? false;
  const hybridSingle = isHybridTool(slug) && !multiple && enhancedUiEnabled;
  const smartRoute = useSmartDocumentRoute(
    hybridSingle && files[0] ? files[0] : null,
    slug,
  );
  const hybrid = useHybridToolWorkflow({
    toolSlug: slug,
    onRestore: async (f) => {
      setFiles([f]);
      setStage("ready");
      setError(null);
    },
  });
  const limits = getLimits(slug);

  const resetWorkflow = useCallback(() => {
    trackInteraction("tool_workflow_reset", { tool_slug: slug });
    if (hybridSingle) void hybrid.clearSession();
    setLastResult(null);
    setFiles([]);
    setStage("upload");
    setProgress(0);
    setError(null);
    setProcessedFile(null);
    hybrid.setModeModalOpen(false);
  }, [slug, setProcessedFile, hybridSingle, hybrid]);
  const maxQueueFiles = multiple ? limits.maxFiles : 1;

  usePremiumFlowRestore(
    slug,
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      setFiles([restored]);
      setStage("ready");
      setError(null);
    },
    { onAutoStart: () => processFiles({ mode: "enhanced" }) },
  );

  const handleFiles = useCallback(async (incoming: File[]) => {
    if (!tool) return;
    if (isHybridTool(slug)) {
      /* Defer mode-specific limits until user picks Normal vs Premium — keep file in state. */
    }
    if (!multiple && incoming.length > 1) {
      setError(t("toolPage.singleFileError"));
      logToolError(slug, "upload_validation", new Error("multiple_files_not_allowed"), { multiple: false });
      return;
    }
    if (incoming.length > maxQueueFiles) {
      setError(t("toolPage.queueLimit", { count: maxQueueFiles }));
      logToolError(slug, "upload_validation", new Error("queue_limit_exceeded"), { max: maxQueueFiles });
      if (showAuthPremiumMarketingUi()) setShowSignInPrompt(true);
      return;
    }
    const totalSizeMB = incoming.reduce((sum, file) => sum + file.size / (1024 * 1024), 0);
    const largestFileMB = Math.max(...incoming.map((f) => f.size / (1024 * 1024)), 0);
    const usage = canUse(incoming.length, totalSizeMB, slug, { largestFileMB });
    if (!usage.allowed) {
      setError(usage.reason ?? t("toolPage.processingFailed"));
      if (showAuthPremiumMarketingUi()) setShowSignInPrompt(true);
      return;
    }
    setError(null);
    const batch = incoming.slice(0, maxQueueFiles);
    if (hybridSingle && batch[0]) {
      await hybrid.acceptUpload(batch[0], { openModeModal: false });
      setFiles([batch[0]]);
      setStage("ready");
      setProgress(0);
      trackInteraction("tool_file_uploaded", { tool_slug: slug, file_count: 1 });
      return;
    }
    setFiles(batch);
    setStage("ready");
    setProgress(0);
    trackInteraction("tool_file_uploaded", { tool_slug: slug, file_count: incoming.length });
  }, [canUse, maxQueueFiles, multiple, slug, t, tool, hybrid, hybridSingle]);

  const processFiles = useCallback(async (options?: { mode?: "browser" | "enhanced" }) => {
    if (!tool || files.length === 0) return;
    if (isCloudOnlyTool(slug) && !toolSupportsCloudProcessing(slug)) {
      setError(
        t("processing.cloudLaunchingSoon", {
          defaultValue: "Premium cloud processing for this format is launching soon.",
        }),
      );
      return;
    }
    const useEnhanced =
      options?.mode === "enhanced" ||
      (options?.mode !== "browser" && isEnhanced) ||
      cloudOnlyActive;
    if (useEnhanced) {
      const file = files[0];
      const ok = await validation.validateFile(file, "enhanced");
      if (!ok) return;
      trackInteraction("tool_processing_started", { tool_slug: tool.slug, mode: "enhanced" });
      setStage("processing");
      setProgress(0);
      setError(null);
      processingUi.resetToFileSelected();
      try {
        let pages: number | null = null;
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          try {
            pages = await getPDFPageCount(file);
          } catch {
            pages = null;
          }
        }
        const cloudOpts = buildCloudJobOptions(slug, smartRoute.analysis, premiumTier);
        const { blob, filename } = await premiumCloud.runPremium(file, pages, cloudOpts);
        setLastResult({ blob, filename, fileCount: 1 });
        setProcessedFile({
          blob,
          filename,
          tool: tool.label,
          toolSlug: tool.slug,
          originalSize: file.size,
          processedSize: blob.size,
        });
        setProgress(100);
        setStage("done");
        toast({
          title: t("toolPage.processingSuccessTitle"),
          description: t("toolPage.processingSuccessDesc"),
        });
      } catch (err) {
        const mapped = mapProcessingError(err);
        logToolError(slug, "enhanced_processing", err, { recoverable: true });
        setError(mapped.message);
        processingUi.markFailed();
        setStage("ready");
      }
      return;
    }

    if (requiresCloudOnlyProcessing(slug)) {
      setError(
        t("processing.cloudRequired", {
          defaultValue: "This tool requires Premium cloud processing. Sign in and use Cloud mode.",
        }),
      );
      return;
    }

    trackInteraction("tool_processing_started", { tool_slug: tool.slug, file_count: files.length });
    setStage("processing");
    setProgress(0);
    setError(null);
    try {
      await runTieredThenCleanup(
        files,
        {
          onProgress: (uploadedBytes, totalBytes) => {
            const safeTotal = Math.max(totalBytes, 1);
            const uploadPct = Math.round((uploadedBytes / safeTotal) * 90);
            setProgress(Math.min(90, Math.max(0, uploadPct)));
          },
        },
        async () => {
          const runBatch = async () => {
            const processed: ProcessedFile[] = [];
            for (let index = 0; index < files.length; index += 1) {
              const file = files[index];
              const { blob, filename } = await processToolOutputSafe(slug, file, t);
              processed.push({ name: filename, blob });
              const convertProgress = Math.round(((index + 1) / Math.max(files.length, 1)) * 10);
              setProgress(90 + convertProgress);
            }
            return processed;
          };
          const processed = await withMinimumDuration(runBatch(), MIN_PROCESSING_DURATION_MS);
          let filePayload: Blob;
          try {
            filePayload = processed.length > 1 ? await createZip(processed) : processed[0].blob;
          } catch (e) {
            logToolError(tool.slug, "zip_packaging", e, { file_count: processed.length });
            throw e;
          }
          const outputName = processed.length > 1 ? `${tool.slug}-bundle.zip` : processed[0].name;
          const originalSize = files.reduce((sum, f) => sum + f.size, 0);
          setLastResult({ blob: filePayload, filename: outputName, fileCount: processed.length });
          setProcessedFile({
            blob: filePayload,
            filename: outputName,
            tool: tool.label,
            toolSlug: tool.slug,
            originalSize,
            processedSize: filePayload.size,
          });
          setProgress(100);
          setStage("done");
          if (hybridSingle && hybrid.sessionId) {
            void recordBrowserUsage(slug, hybrid.sessionId);
          }
          toast({
            title: t("toolPage.processingSuccessTitle"),
            description: t("toolPage.processingSuccessDesc"),
          });
        },
      );
    } catch (err) {
      logToolError(slug, "processing", err, { file_count: files.length });
      setError(conversionErrorMessage(err, t));
      setStage("ready");
      setProgress(0);
    }
  }, [
    files,
    slug,
    t,
    tool,
    setProcessedFile,
    isEnhanced,
    cloudOnlyActive,
    validation,
    premiumCloud,
    processingUi,
    smartRoute.analysis,
  ]);

  const browserPreviewUrl = useMemo(() => {
    if (!lastResult?.blob) return null;
    return URL.createObjectURL(lastResult.blob);
  }, [lastResult?.blob]);

  useEffect(() => {
    return () => {
      if (browserPreviewUrl) URL.revokeObjectURL(browserPreviewUrl);
    };
  }, [browserPreviewUrl]);

  const handleDesktopDownload = useCallback(async () => {
    if (!lastResult?.blob) return;
    await safeDownloadBlob(lastResult.blob, lastResult.filename);
  }, [lastResult]);

  if (dedicatedRoute) {
    return <Redirect to={dedicatedRoute} />;
  }

  if (!tool) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">{t("toolPage.toolNotFound")}</h1>
        <p className="text-base text-muted-foreground mb-6">We could not locate that tool. Please choose a valid PDFTrusted tool from the menu.</p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-colors">{t("toolPage.backHome")}</a>
      </div>
    );
  }

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload"
    : stage === "ready" ? "configure"
    : stage === "processing" ? "processing"
    : "done";

  const primaryFile = files[0] ?? null;

  const desktopExperience = tool ? (
    <GenericToolDesktopAdapter
      toolSlug={slug}
      stage={normalizeToolStage(stage)}
      file={primaryFile}
      files={multiple ? files : undefined}
      multiple={multiple}
      accept={accepts}
      progress={isEnhanced ? premiumCloud.progress : progress}
      isEnhanced={isEnhanced}
      cloudProgress={premiumCloud.progress}
      resultBlob={lastResult?.blob ?? null}
      resultFilename={lastResult?.filename ?? ""}
      objectUrl={browserPreviewUrl}
      onFiles={handleFiles}
      onProcessSelection={({ tier, mode }) => {
        setPremiumTier(tier);
        void processFiles({ mode });
      }}
      browserDisabledReason={
        hybridSingle && smartRoute.shouldBlockBrowser
          ? t("premiumTier.scannedUsePro", {
              defaultValue: "Scanned PDF — use Trusted Cloud for best results.",
            })
          : null
      }
      enhancedUiEnabled={enhancedUiEnabled && cloudCapable}
      isSignedIn={isSignedIn}
      onRequestSignIn={() =>
        requestSignIn({ reason: t("toolPage.signInPromptDesc"), tone: "cloud" })
      }
      onReset={resetWorkflow}
      onDownload={handleDesktopDownload}
      showBrowser={!cloudOnlyActive}
      showPremium={cloudCapable}
      processLabel={tool.label}
    />
  ) : null;

  const securityBadgeGrid = (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-border bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{t("toolPage.security")}</p>
        <p className="mt-2 text-sm leading-6 text-foreground">{SECURITY_BADGE_TEXT}</p>
      </div>
      <div className="rounded-3xl border border-border bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{t("toolPage.batch")}</p>
        <p className="mt-2 text-sm leading-6 text-foreground">
          {multiple ? t("toolPage.batchEnabled") : t("toolPage.batchSingle")}
        </p>
      </div>
    </div>
  );

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload" ? "upload" : stage === "ready" ? "configure" : stage === "processing" ? "process" : "done";

  const mobileProcessButton =
    files.length > 0 && stage === "ready" ? (
      <button
        type="button"
        onClick={() =>
          void processFiles(
            isHybridTool(slug) && enhancedUiEnabled
              ? { mode: mode === "enhanced" ? "enhanced" : "browser" }
              : undefined,
          )
        }
        className={TOOL_PRIMARY_BTN}
      >
        <CloudDownload className="h-5 w-5" />
        {t("toolPage.start")} {tool.label}
      </button>
    ) : null;

  const mobilePage = (
    <MobileToolLayout
      slug={slug}
      toolLabel={toolLabel}
      title={tool.label}
      workflowStep={mobileWorkflowStep}
      processButton={mobileProcessButton}
      postProcessPanel={
        stage === "done" && lastResult ? (
          <MobilePostProcessPanel
            currentSlug={slug}
            onDownload={() => void safeDownloadBlob(lastResult.blob, lastResult.filename)}
            onShare={() => void shareBlob(lastResult.blob, lastResult.filename)}
            onProcessAnother={resetWorkflow}
          />
        ) : undefined
      }
    >
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-6">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <TrustShieldPrivacyNotice />
            <TrustShieldPrivacyToggle />
            {files[0] && <DocumentAuditorPanel file={files[0]} className="mt-4 mb-6" />}

            <ToolWorkflowShell
              stage={workflowStage}
              toolSlug={slug}
              progress={stage === "processing" ? (isEnhanced ? premiumCloud.progress : progress) : undefined}
              progressLabel={stage === "processing" ? `${tool.label} — ${t("toolPage.processing")}` : undefined}
              processingTitle={`${t("toolPage.processing")} ${tool.label}`}
              processingSubtitle={t("toolPage.secureProcessingSubtitle", {
                defaultValue: "Your file is being handled securely in your browser.",
              })}
              processingContent={
                isEnhanced && stage === "processing" ? (
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
                ) : undefined
              }
              upload={
                <>
                  <ToolUploadSlot
                    files={files}
                    onFiles={handleFiles}
                    accept={accepts}
                    multiple={multiple}
                    sublabel={multiple ? t("toolPage.multiUploadHint") : t("toolPage.uploadHint")}
                    onRemoveAt={(index) => {
                      const next = files.filter((_, i) => i !== index);
                      setFiles(next);
                      if (!next.length) setStage("upload");
                    }}
                  />
                  {securityBadgeGrid}
                </>
              }
              configure={
                <>
                  {files.length > 0 && stage === "ready" ? (
                    multiple ? (
                      <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-card p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          {t("toolWorkspace.uploadSuccess", { defaultValue: "Upload successful" })}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {t("toolPage.filesReady", { count: files.length })}
                        </p>
                        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto overscroll-contain text-xs text-muted-foreground">
                          {files.map((f, i) => (
                            <li key={`${f.name}-${i}`} className="truncate">
                              {f.name} · {(f.size / 1024).toFixed(0)} KB
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <ToolInputPreview
                        file={files[0]}
                        label="Your file"
                        className="mb-4 w-full max-w-xl"
                      />
                    )
                  ) : null}
                  {hybridSingle && files[0] && stage === "ready" ? (
                    <>
                      <DocumentQualityHint file={files[0]} toolSlug={slug} className="mb-4" />
                      {enhancedUiEnabled ? (
                        <div className="mb-4 rounded-2xl border border-border bg-card/80 p-4">
                          <HybridModeSheetPanel
                            toolSlug={slug}
                            file={files[0]}
                            browserDisabledReason={
                              smartRoute.shouldBlockBrowser
                                ? t("premiumTier.scannedUsePro", {
                                    defaultValue: "Scanned PDF — use Trusted Cloud for best results.",
                                  })
                                : null
                            }
                            onTierSelect={(tier, pickMode) => {
                              setPremiumTier(tier);
                              setMode(pickMode);
                            }}
                            onRunPremium={() => void processFiles({ mode: "enhanced" })}
                            onRunNormal={() => void processFiles({ mode: "browser" })}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {securityBadgeGrid}
                  {stage === "ready" && (
                    <div className="mt-6 rounded-3xl border border-border bg-muted/50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                        <span>{t("toolPage.ready")}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-sm text-muted-foreground">
                    {files.length === 0 && t("toolPage.uploadBegin")}
                    {files.length > 0 && t("toolPage.filesReady", { count: files.length })}
                  </div>
                </>
              }
              done={
                lastResult ? (
                  <>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href="/pdf-editor"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-4 text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/5"
                      >
                        {t("toolPage.editInEditor")}
                      </a>
                    </div>
                    <div className="mt-6 text-sm text-muted-foreground">{t("toolPage.processingDone")}</div>
                    {lastResult.fileCount > 1 ? (
                      <ToolResultPanel
                        mode="bundle"
                        blob={lastResult.blob}
                        filename={lastResult.filename}
                        fileCount={lastResult.fileCount}
                        title={t("toolPage.completed", { defaultValue: "Completed" })}
                        hideFooterAd={hideWorkflowAds}
                        onProcessAnother={resetWorkflow}
                      />
                    ) : (
                      <ToolResultPanel
                        blob={lastResult.blob}
                        filename={lastResult.filename}
                        sourceFile={files.length === 1 ? files[0] : undefined}
                        sourceFiles={files.length > 1 ? files : undefined}
                        title={t("toolPage.completed", { defaultValue: "Completed" })}
                        hideFooterAd={hideWorkflowAds}
                        onProcessAnother={resetWorkflow}
                      />
                    )}
                    {multiple ? (
                      <div className="mt-2 text-xs text-muted-foreground">{t("toolPage.queueInfo", { count: maxQueueFiles })}</div>
                    ) : null}
                  </>
                ) : (
                  <div />
                )
              }
            />
          </div>
      {isHybridTool(slug) ? (
        <>
          <FileLimitModal
            open={validation.limitModalOpen}
            onOpenChange={validation.setLimitModalOpen}
            result={validation.limitModal}
            toolSlug={slug}
            file={files[0] ?? null}
            onContinuePremium={() => void processFiles({ mode: "enhanced" })}
          />
          <FallbackToPremiumModal
            open={validation.fallbackOpen}
            onOpenChange={validation.setFallbackOpen}
            toolSlug={slug}
            file={files[0] ?? null}
            onContinuePremium={() => void processFiles({ mode: "enhanced" })}
          />
        </>
      ) : null}
      <Dialog open={showSignInPrompt} onOpenChange={setShowSignInPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("toolPage.signInPromptTitle")}</DialogTitle>
            <DialogDescription>{t("toolPage.signInPromptDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setShowSignInPrompt(false);
                requestSignIn({
                  reason: t("toolPage.signInPromptDesc"),
                  tone: "cloud",
                  deferredAction: "reload",
                });
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
            >
              {t("toolPage.signInCta")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileToolLayout>
  );

  const toolChrome = (
    <ToolRenderErrorBoundary onReset={resetWorkflow}>
      <ToolSEO title={toolLabel} description={metaDescription} slug={slug} lang={i18n.resolvedLanguage || "en"} />
      <ToolPageSplit desktop={desktopExperience} mobile={mobilePage} />
    </ToolRenderErrorBoundary>
  );

  if (isCloudOnlyTool(slug)) {
    return <CloudOnlyToolChrome toolSlug={slug}>{toolChrome}</CloudOnlyToolChrome>;
  }
  if (isHybridTool(slug) && isEnhancedProcessingEnabled()) {
    return <HybridToolChrome toolSlug={slug}>{toolChrome}</HybridToolChrome>;
  }
  return toolChrome;
}

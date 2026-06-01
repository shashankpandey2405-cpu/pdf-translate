import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Image, AlertCircle } from "lucide-react";
import ToolSEO from "@/components/ToolSEO";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import SecurityBadge from "@/components/SecurityBadge";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { usePremium } from "@/context/PremiumContext";
import { buildPdfPageImagesZip } from "@/tools/pdf-to-image/logic";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { content } from "@/tools/pdf-to-image/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { HybridToolChrome } from "@/components/processing/HybridToolChrome";
import { ExecutionModeSelector } from "@/components/processing/ExecutionModeSelector";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { HonestProcessingTiers } from "@/components/tools/HonestProcessingTiers";

type Format = "jpeg" | "png";
type Quality = "standard" | "high";

export default function PDFToImage() {
  const { i18n } = useTranslation();
  const [location] = useLocation();
  const forcedFormat = useMemo<Format | null>(() => {
    const path = location.split("?")[0];
    if (path.endsWith("/pdf-to-png")) return "png";
    if (path.endsWith("/pdf-to-jpg")) return "jpeg";
    return null;
  }, [location]);
  const seoSlug = useMemo(() => {
    const path = location.split("?")[0];
    if (path.endsWith("/pdf-to-png")) return "pdf-to-png";
    if (path.endsWith("/pdf-to-jpg")) return "pdf-to-jpg";
    return "pdf-to-image";
  }, [location]);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<Format>(() => forcedFormat ?? "jpeg");
  const [quality, setQuality] = useState<Quality>("standard");
  const [stage, setStage] = useState<"upload" | "configure" | "converting" | "done">("upload");
  const [convertProgress, setConvertProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zipResult, setZipResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const { canUse } = usePremium();
  const { mode, enabled: enhancedUiEnabled } = useProcessingMode();
  const premiumCloud = usePremiumCloudRun(seoSlug, content.hero.title);
  const isEnhanced = enhancedUiEnabled && mode === "enhanced";

  // Sync format when routed via aliases (/pdf-to-png, /pdf-to-jpg).
  useEffect(() => {
    if (forcedFormat) setFormat(forcedFormat);
  }, [forcedFormat]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    const mb = f.size / (1024 * 1024);
    const check = canUse(1, mb, seoSlug, { largestFileMB: mb });
    if (!check.allowed) {
      setError(check.reason!);
      logToolError(seoSlug, "upload_premium_blocked", new Error(check.reason ?? "blocked"));
      return;
    }
    setFile(f);
    setStage("configure");
    setError(null);
    getPDFPageCount(f).then(setPageCount);
  }, [canUse, seoSlug]);

  async function handleConvert() {
    if (!file) return;
    setStage("converting");
    setConvertProgress(0);
    setZipResult(null);
    try {
      if (isEnhanced) {
        const dpi = quality === "high" ? 200 : 150;
        const { blob, filename } = await premiumCloud.runPremium(file, pageCount, {
          imageFormat: format === "jpeg" ? "jpeg" : "png",
          dpi,
        });
        setConvertProgress(100);
        setZipResult({ blob, filename });
        setStage("done");
        return;
      }
      await runTieredThenCleanup(
        [file],
        {
          onProgress: (u, t) => {
            const safe = Math.max(t, 1);
            setConvertProgress(Math.round((u / safe) * 65));
          },
        },
        async () => {
          const { blob, filename } = await buildPdfPageImagesZip(file, format);
          setConvertProgress(100);
          setZipResult({ blob, filename });
          setStage("done");
        },
      );
    } catch (err) {
      logToolError(seoSlug, "convert_processing", err);
      setError(err instanceof Error ? err.message : "Failed to convert PDF.");
      setStage("configure");
    }
  }

  const resetWorkflow = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setFormat(forcedFormat ?? "jpeg");
    setQuality("standard");
    setStage("upload");
    setConvertProgress(0);
    setZipResult(null);
    setError(null);
  }, [forcedFormat]);

  const formatQualitySettings = file && stage === "configure" ? (
    <>
      {enhancedUiEnabled ? (
        <div className="mb-4">
          <ExecutionModeSelector toolSlug={seoSlug} />
        </div>
      ) : null}
      <HonestProcessingTiers tool="pdf-to-image" className="mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Format</label>
          <div className="grid grid-cols-2 gap-2">
            {(["jpeg", "png"] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                disabled={!!forcedFormat}
                className={`rounded-xl border-2 p-3 text-sm font-semibold ${format === f ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Quality</label>
          <div className="grid grid-cols-2 gap-2">
            {(["standard", "high"] as Quality[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={`rounded-xl border-2 p-3 text-sm font-semibold capitalize ${quality === q ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  ) : null;

  const desktop = (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="hidden lg:block">
            <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug={seoSlug} lang={i18n.language} />
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
            <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 rounded-2xl flex items-center justify-center">
              <Image className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{content.hero.title}</h1>
              <p className="text-sm text-muted-foreground">{content.hero.subtitle}</p>
              <SecurityBadge />
            </div>
          </div>

          <ToolWorkflowActions
            onReset={resetWorkflow}
            resetDisabled={stage === "converting"}
            className="mb-4"
          />

          {error && (
            <div className="mb-4 flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          {stage === "upload" && (
              <div>
                <ToolUploadSlot
                  files={[]}
                  onFiles={handleFiles}
                  accept=".pdf,application/pdf"
                  multiple={false}
                  label="Drop your PDF here"
                  sublabel="Convert every page to JPG or PNG"
                />
              </div>
            )}

            {stage === "configure" && file && (
              <div>
                {enhancedUiEnabled ? (
                  <div className="mb-6">
                    <ExecutionModeSelector toolSlug={seoSlug} />
                  </div>
                ) : null}
                <HonestProcessingTiers tool="pdf-to-image" className="mb-4 max-w-xl" />
                <ToolInputPreview file={file} label="Your PDF" fullPage className="mb-6 w-full max-w-xl" />

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["jpeg", "png"] as Format[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormat(f)}
                          disabled={!!forcedFormat}
                          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${format === f ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Quality</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["standard", "high"] as Quality[]).map((q) => (
                        <button key={q} onClick={() => setQuality(q)}
                          className={`p-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${quality === q ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"}`}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  data-testid="button-convert-to-image"
                  onClick={handleConvert}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Image className="w-4 h-4" />
                  Convert {pageCount} Page{pageCount !== 1 ? "s" : ""} to {format.toUpperCase()}
                </button>
              </div>
            )}

            {stage === "converting" && (
              <div>
                <ProcessingStatus
                  type={isEnhanced ? "cloud" : "instant"}
                  progress={convertProgress}
                  label="Converting pages…"
                  className="py-20"
                />
              </div>
            )}

            {stage === "done" && zipResult && (
              <div>
                <ToolResultPanel
                  blob={zipResult.blob}
                  filename={zipResult.filename}
                  sourceFile={file}
                  title={isEnhanced ? "Cloud conversion ready" : "ZIP ready — all pages as images"}
                  onProcessAnother={resetWorkflow}
                />
              </div>
            )}
            </div>

            <aside className="hidden lg:block">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-bold text-foreground">How it works</h3>
                <div className="space-y-4">
                  {content.steps.map((step) => (
                    <div key={step.number} className="flex gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{step.number}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
  );

  const mobileWorkflowStep =
    stage === "upload" ? "upload" : stage === "configure" ? "configure" : stage === "converting" ? "process" : "done";

  const mobile = (
    <MobileToolLayout
      slug={seoSlug}
      toolLabel={content.hero.title}
      title={content.hero.title}
      workflowStep={mobileWorkflowStep}
      settingsPanel={formatQualitySettings}
      processButton={
        stage === "configure" && file ? (
          <button type="button" data-testid="button-convert-to-image" onClick={handleConvert} className={TOOL_PRIMARY_BTN}>
            <Image className="h-4 w-4" />
            Convert {pageCount} Page{pageCount !== 1 ? "s" : ""}
          </button>
        ) : null
      }
      postProcessPanel={
        zipResult && stage === "done" ? (
          <MobilePostProcessPanel
            currentSlug={seoSlug}
            onDownload={() => void safeDownloadBlob(zipResult.blob, zipResult.filename)}
            onProcessAnother={resetWorkflow}
          />
        ) : undefined
      }
    >
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug={seoSlug} lang={i18n.language} />
      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}
      {stage === "upload" && (
        <ToolUploadSlot
          files={file ? [file] : []}
          onFiles={handleFiles}
          accept=".pdf,application/pdf"
          multiple={false}
          label="Drop your PDF here"
          sublabel="Convert every page to JPG or PNG"
          onRemoveFile={resetWorkflow}
        />
      )}
      {stage === "configure" && file ? <ToolInputPreview file={file} label="Your PDF" fullPage className="mb-4 w-full" /> : null}
      {stage === "converting" && (
        <ProcessingStatus
          type={isEnhanced ? "cloud" : "instant"}
          progress={convertProgress}
          label="Converting pages…"
          className="py-16"
        />
      )}
      {stage === "done" && zipResult ? (
        <p className="py-6 text-center text-sm font-medium text-green-600">ZIP ready — use Download in the panel below</p>
      ) : null}
    </MobileToolLayout>
  );

  return (
    <ToolRouteShell
      slug={seoSlug}
      toolName={content.hero.title}
      seoTitle={content.hero.title}
      seoDescription={content.hero.subtitle}
      onReset={resetWorkflow}
    >
      <HybridToolChrome toolSlug={seoSlug}>
        <ToolRenderErrorBoundary onReset={resetWorkflow}>
          <ToolPageSplit desktop={desktop} mobile={mobile} />
        </ToolRenderErrorBoundary>
      </HybridToolChrome>
    </ToolRouteShell>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScanLine, Download, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import ToolSEO from "@/components/ToolSEO";
import { logToolError, logToolSuccess } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { withMinimumDuration, MIN_PROCESSING_DURATION_MS } from "@/tools/toolPipeline/registry";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getDeviceCapability } from "@/lib/deviceCapability";
import { isMobileSafari } from "@/lib/download/isIOS";
import { getToolHref } from "../../../constants/tools";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { BrowserToolDesktopAdapter } from "@/components/desktop/adapters/BrowserToolDesktopAdapter";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

type Stage = "upload" | "configure" | "processing" | "done";

const MAX_SCANS = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/*";

export default function AiScanner() {
  const { t, i18n: i18nInstance } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [stage, setStage] = useState<Stage>("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [perspective, setPerspective] = useState(true);
  const [enhance, setEnhance] = useState(true);
  const [portrait, setPortrait] = useState(true);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  const preferCloudScan = isMobileSafari() || getDeviceCapability().tier === "low";

  const resetAll = useCallback(() => {
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setResultUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setResultBlob(null);
    setFile(null);
    setUploadsCount(0);
    setError(null);
    setProgress(0);
    setStage("upload");
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      if (uploadsCount >= MAX_SCANS) {
        setError("You can process up to 5 scans per session. Reset to start over.");
        return;
      }
      const f = files[0];
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) {
        setError("For speed in your browser, please use images up to 20MB (compress larger photos first).");
        return;
      }
      setError(null);
      setFile(f);
      setUploadsCount((count) => count + 1);
      setPreviewUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return URL.createObjectURL(f);
      });
      setResultUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      setResultBlob(null);
      setStage("configure");
    },
    [uploadsCount],
  );

  const processScan = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    setProgress(8);
    setError(null);
    setResultUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setResultBlob(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      await runTieredThenCleanup(
        [file],
        {
          onProgress: (u, total) => {
            const safe = Math.max(total, 1);
            const candidate = Math.max(8, Math.round((u / safe) * 40));
            setProgress((p) => nextProgress(p, candidate));
          },
        },
        async () => {
          timer = setInterval(() => {
            setProgress((p) => nextProgress(p, Math.min(p + 6, 92)));
          }, 180);
          const { scanImageFile } = await import("@/tools/ai-scanner/processScan");
          const blob = await withMinimumDuration(
            scanImageFile(file, { perspective, enhance, portrait }, controller.signal),
            MIN_PROCESSING_DURATION_MS,
          );
          const url = URL.createObjectURL(blob);
          setResultBlob(blob);
          setResultUrl(url);
          setProgress(100);
          setStage("done");
        },
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Processing timed out. Please try a smaller file for faster results.");
        logToolError("tools/ai-scanner", "processing_timeout", e);
      } else {
        setError(e instanceof Error ? e.message : t("scanner.errors.generic"));
        logToolError("tools/ai-scanner", "processing_opencv_pipeline", e);
      }
      setStage("configure");
    } finally {
      if (timer) clearInterval(timer);
      window.clearTimeout(timeout);
    }
  }, [file, perspective, enhance, portrait, t]);

  const downloadResult = useCallback(async () => {
    if (!resultBlob || !file) return;
    const name = file.name.replace(/\.[^.]+$/, "") + "_scanned.png";
    await safeDownloadBlob(resultBlob, name);
    logToolSuccess("tools/ai-scanner", { output: "png_image" });
  }, [resultBlob, file]);

  const downloadPdf = useCallback(async () => {
    if (!resultBlob || !file) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const imageBytes = await resultBlob.arrayBuffer();
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngImage.width,
        height: pngImage.height,
      });
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      await safeDownloadBlob(pdfBlob, file.name.replace(/\.[^.]+$/, "") + "_scanned.pdf");
      logToolSuccess("tools/ai-scanner", { output: "pdf" });
    } catch (e) {
      logToolError("tools/ai-scanner", "pdf_build_from_scan", e);
    }
  }, [resultBlob, file]);

  const scannerOptions = (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">{t("scanner.optionsTitle")}</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <Label htmlFor="opt-perspective" className="cursor-pointer text-sm">
            {t("scanner.optPerspective")}
          </Label>
          <Switch
            id="opt-perspective"
            checked={perspective}
            onCheckedChange={setPerspective}
            disabled={stage === "processing"}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <Label htmlFor="opt-enhance" className="cursor-pointer text-sm">
            {t("scanner.optEnhance")}
          </Label>
          <Switch id="opt-enhance" checked={enhance} onCheckedChange={setEnhance} disabled={stage === "processing"} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <Label htmlFor="opt-portrait" className="cursor-pointer text-sm">
            {t("scanner.optPortrait")}
          </Label>
          <Switch id="opt-portrait" checked={portrait} onCheckedChange={setPortrait} disabled={stage === "processing"} />
        </div>
      </div>
      {preferCloudScan ? (
        <p className="text-xs text-muted-foreground">
          <a href={getToolHref({ slug: "smart-scan-ai" })} className="font-semibold text-primary hover:underline">
            Smart Scan AI (cloud)
          </a>{" "}
          works better on this device for heavy photos.
        </p>
      ) : null}
      <button
        type="button"
        onClick={resetAll}
        disabled={stage === "processing"}
        className="w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
      >
        {t("common.reset", { defaultValue: "Reset" })}
      </button>
    </div>
  );

  const resultFilename = useMemo(
    () => (file ? file.name.replace(/\.[^.]+$/, "") + "_scanned.png" : "scanned.png"),
    [file],
  );

  const workflowStage: ToolWorkflowStage = stage;
  const workflowStep: ToolWorkflowStepId =
    stage === "upload" ? "upload" : stage === "configure" ? "configure" : stage === "processing" ? "process" : "done";

  const desktopExperience = (
    <BrowserToolDesktopAdapter
      toolSlug="ai-scanner"
      stage={stage}
      file={file}
      progress={progress}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={resultUrl}
      onFiles={handleFiles}
      onRun={processScan}
      onReset={resetAll}
      onDownload={downloadResult}
      extraOptions={scannerOptions}
      processLabel={t("scanner.runScan")}
    />
  );

  const mobilePage = (
    <MobileToolLayout
      slug="ai-scanner"
      toolLabel={t("tools.ai-scanner.label", { defaultValue: "Document Scanner" })}
      title={t("scanner.heroTitle")}
      settingsPanel={scannerOptions}
      workflowStep={workflowStep}
      autoOpenSettings={stage === "configure" && Boolean(file)}
      processButton={
        stage === "configure" && file ? (
          <Button type="button" size="lg" className={`${TOOL_PRIMARY_BTN} w-full`} onClick={() => void processScan()}>
            <ScanLine className="mr-2 h-5 w-5" aria-hidden />
            {t("scanner.runScan")}
          </Button>
        ) : stage === "done" ? (
          <div className="flex w-full flex-col gap-2">
            <Button type="button" size="lg" className={`${TOOL_PRIMARY_BTN} w-full`} onClick={downloadResult}>
              <Download className="mr-2 h-5 w-5" aria-hidden />
              {t("scanner.downloadImages", { defaultValue: "Download image" })}
            </Button>
            <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => void downloadPdf()}>
              <Download className="mr-2 h-5 w-5" aria-hidden />
              PDF
            </Button>
          </div>
        ) : null
      }
      postProcessPanel={
        stage === "done" ? (
          <div className="space-y-3">
            {scannerOptions}
            <Button type="button" variant="outline" className="w-full" onClick={resetAll}>
              {t("common.scanAnother", { defaultValue: "Scan another" })}
            </Button>
          </div>
        ) : undefined
      }
    >
      <ToolSEO title={t("scanner.seoTitle")} description={t("scanner.seoDesc")} slug="tools/ai-scanner" lang={i18nInstance.language} />

      {error ? (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      ) : null}

      <ToolWorkflowShell
        stage={workflowStage}
        toolSlug="ai-scanner"
        progress={stage === "processing" ? progress : undefined}
        progressLabel={stage === "processing" ? t("scanner.statusProcessing") : undefined}
        processingTitle={t("scanner.processing")}
        processingSubtitle={t("scanner.statusFootnote", { seconds: 3 })}
        upload={
          <ToolUploadSlot
            files={file ? [file] : []}
            onFiles={handleFiles}
            accept={ACCEPT}
            label={t("scanner.dropLabel")}
            sublabel={t("scanner.dropSub")}
            onRemoveFile={() => {
              setFile(null);
              setPreviewUrl((u) => {
                if (u) URL.revokeObjectURL(u);
                return null;
              });
              setStage("upload");
            }}
          />
        }
        configure={
          previewUrl ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("scanner.original")}</p>
                <img src={previewUrl} alt="" className="max-h-[50vh] w-full rounded-xl object-contain" />
              </div>
              {resultUrl ? (
                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("scanner.result")}</p>
                  <img src={resultUrl} alt="" className="max-h-[50vh] w-full rounded-xl object-contain" />
                </div>
              ) : null}
            </div>
          ) : (
            <div />
          )
        }
        done={
          resultUrl ? (
            <div className="rounded-2xl border border-border bg-card p-3">
              <img src={resultUrl} alt="" className="max-h-[50vh] w-full rounded-xl object-contain" />
            </div>
          ) : (
            <div />
          )
        }
      />
    </MobileToolLayout>
  );

  return (
    <ToolRenderErrorBoundary onReset={resetAll}>
      <ToolPageSplit desktop={desktopExperience} mobile={mobilePage} />
    </ToolRenderErrorBoundary>
  );
}

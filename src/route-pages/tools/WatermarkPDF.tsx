"use client";

import { useState, useCallback, useMemo } from "react";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { BrowserToolDesktopAdapter } from "@/components/desktop/adapters/BrowserToolDesktopAdapter";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { useTranslation } from "react-i18next";
import { Stamp, AlertCircle } from "lucide-react";
import ToolSEO from "@/components/ToolSEO";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { addWatermark, getWatermarkedFilename, type WatermarkOptions } from "@/tools/watermark-pdf/logic";
import { content } from "@/tools/watermark-pdf/content";
import { logToolError } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import LiveWatermarkPreview from "@/components/watermark/LiveWatermarkPreview";
import { WatermarkOptionsForm, type WatermarkColor } from "@/components/watermark/WatermarkOptionsForm";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { ToolErrorState } from "@/components/tools/ToolErrorState";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import ToolProcessingRing from "@/components/tools/ToolProcessingRing";

export default function WatermarkPDF() {
  const { i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState<WatermarkColor>("gray");
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState<WatermarkOptions["position"]>("center");
  const [anchorX, setAnchorX] = useState(0.5);
  const [anchorY, setAnchorY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [stage, setStage] = useState<"upload" | "configure" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { canUse } = usePremium();

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      const totalMB = f.size / (1024 * 1024);
      const check = canUse(1, totalMB, "watermark-pdf", { largestFileMB: totalMB });
      if (!check.allowed) {
        setError(check.reason!);
        logToolError("watermark-pdf", "upload_premium_blocked", new Error(check.reason ?? "blocked"));
        return;
      }
      setFile(f);
      setStage("configure");
      setError(null);
    },
    [canUse],
  );

  async function handleWatermark() {
    if (!file || !text.trim()) {
      setError("Please enter watermark text.");
      logToolError("watermark-pdf", "validation_watermark_text", new Error("empty_watermark_text"));
      return;
    }
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
            const result = await addWatermark(file, {
              text: text.trim(),
              opacity,
              fontSize,
              color,
              rotation,
              position,
              anchorX,
              anchorY,
            });
            setProgress(100);
            const blob = new Blob([result as BlobPart], { type: "application/pdf" });
            const filename = getWatermarkedFilename(file);
            setProcessedFile({
              blob,
              filename,
              tool: "Add Watermark",
              toolSlug: "watermark-pdf",
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
      logToolError("watermark-pdf", "watermark_processing", err);
      setError(err instanceof Error ? err.message : "Failed to add watermark.");
      setStage("configure");
    }
  }

  const resetAll = () => {
    setFile(null);
    setText("CONFIDENTIAL");
    setOpacity(0.3);
    setFontSize(48);
    setColor("gray");
    setRotation(45);
    setPosition("center");
    setAnchorX(0.5);
    setAnchorY(0.5);
    setZoom(1);
    setStage("upload");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  };

  const optionsForm = (
    <WatermarkOptionsForm
      text={text}
      onTextChange={setText}
      opacity={opacity}
      onOpacityChange={setOpacity}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      color={color}
      onColorChange={setColor}
      rotation={rotation}
      onRotationChange={setRotation}
      zoom={zoom}
      onZoomChange={setZoom}
      position={position}
      onPositionChange={(next, ax, ay) => {
        setPosition(next);
        setAnchorX(ax);
        setAnchorY(ay);
      }}
      compact
    />
  );

  const previewUrl = useMemo(() => (resultBlob ? URL.createObjectURL(resultBlob) : null), [resultBlob]);

  const desktopExperience = (
    <BrowserToolDesktopAdapter
      toolSlug="watermark-pdf"
      stage={stage}
      file={file}
      progress={progress}
      resultBlob={resultBlob}
      resultFilename={resultFilename}
      objectUrl={previewUrl}
      onFiles={handleFiles}
      onRun={handleWatermark}
      onReset={resetAll}
      extraOptions={optionsForm}
      processLabel="Add Watermark"
    />
  );

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload" : stage === "configure" ? "configure" : stage === "processing" ? "processing" : "done";

  const mobileWorkflowStep: ToolWorkflowStepId =
    stage === "upload" ? "upload" : stage === "configure" ? "configure" : stage === "processing" ? "process" : "done";

  const mobileProcessButton =
    stage === "configure" && file ? (
      <button
        type="button"
        data-testid="button-add-watermark"
        disabled={!text.trim()}
        onClick={() => void handleWatermark()}
        className={TOOL_PRIMARY_BTN}
      >
        <Stamp className="h-4 w-4" />
        Add Watermark
      </button>
    ) : null;

  const mobilePage = (
    <MobileToolLayout
      slug="watermark-pdf"
      toolLabel={content.hero.title}
      title={content.hero.title}
      workflowStep={mobileWorkflowStep}
      processButton={mobileProcessButton}
      autoOpenSettings={(stage === "configure" && Boolean(file)) || (stage === "done" && Boolean(resultBlob))}
      settingsPanel={file && stage === "configure" ? optionsForm : undefined}
      postProcessPanel={
        resultBlob ? (
          <MobilePostProcessPanel
            currentSlug="watermark-pdf"
            onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
            onShare={() => void shareBlob(resultBlob, resultFilename)}
            onProcessAnother={resetAll}
            downloadLabel="Download watermarked PDF"
          />
        ) : undefined
      }
    >
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="watermark-pdf" lang={i18n.language} />

      {error ? (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <ToolWorkflowShell
        stage={workflowStage}
        toolSlug="watermark-pdf"
        progress={stage === "processing" ? progress : undefined}
        processingTitle="Adding watermark…"
        upload={
          <ToolUploadSlot
            files={file ? [file] : []}
            onFiles={handleFiles}
            multiple={false}
            label="Drop your PDF here"
            sublabel="Add custom text watermarks to every page"
            onRemoveFile={resetAll}
          />
        }
        configure={
          file ? (
            <div className="min-h-[min(40vh,360px)]">
              <LiveWatermarkPreview
                file={file}
                text={text}
                fontSize={fontSize}
                opacity={opacity}
                color={color}
                rotation={rotation}
                zoom={zoom}
                anchorX={anchorX}
                anchorY={anchorY}
                onAnchorChange={(x, y) => {
                  setAnchorX(x);
                  setAnchorY(y);
                }}
              />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Open settings (gear) to adjust text, color, and position.
              </p>
            </div>
          ) : null
        }
        processingContent={
          <ToolProcessingRing progress={progress} title="Adding watermark…" type="instant" />
        }
        done={
          resultBlob ? (
            <ToolResultPanel
              blob={resultBlob}
              filename={resultFilename}
              title="Watermarked PDF ready"
              hideFooterAd
              onProcessAnother={resetAll}
            />
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

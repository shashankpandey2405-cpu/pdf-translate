"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  FileType,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import DropZone from "@/components/DropZone";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { TrustShieldPrivacyNotice } from "@/components/trustShield/TrustShieldPrivacyNotice";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/context/PremiumContext";
import { useProcess } from "@/context/ProcessContext";
import { useWorkspaceHistory } from "@/context/WorkspaceHistoryContext";
import { persistWorkspaceOutput } from "@/lib/workspaceHistory/persistOutput";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { conversionErrorMessage, withMinimumDuration } from "@/tools/toolPipeline/registry";
import { runUniversalConversion } from "@/tools/universal-converter/runConversion";
import {
  detectFormat,
  formatLabel,
  getTargetsForFormat,
  parseQueryFormats,
  type FormatId,
  type TargetId,
} from "@/data/universalConverter/matrix";
import { logToolError, logToolSuccess } from "@/utils/logger";
import { Link } from "wouter";
import { appPath } from "@/lib/appPaths";

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.txt,application/pdf,image/*";

export default function UniversalConverter() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { canUse } = usePremium();
  const { setProcessedFile } = useProcess();
  const { saveSession } = useWorkspaceHistory();

  const [file, setFile] = useState<File | null>(null);
  const [fromFormat, setFromFormat] = useState<FormatId | null>(null);
  const [toFormat, setToFormat] = useState<TargetId | null>(null);
  const [stage, setStage] = useState<"idle" | "ready" | "converting" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);

  const targets = useMemo(
    () => (fromFormat ? getTargetsForFormat(fromFormat) : []),
    [fromFormat],
  );

  const queryPreset = useMemo(
    () => parseQueryFormats(typeof window !== "undefined" ? window.location.search : ""),
    [location],
  );

  useEffect(() => {
    if (queryPreset.to) setToFormat(queryPreset.to);
  }, [queryPreset.to]);

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      const mb = f.size / (1024 * 1024);
      const check = canUse(1, mb, "universal-converter", { largestFileMB: mb });
      if (!check.allowed) {
        setError(check.reason ?? t("pdfEditor.premiumLimitFallback"));
        return;
      }
      const detected = detectFormat(f);
      setFile(f);
      setFromFormat(detected);
      const options = getTargetsForFormat(detected);
      const q = parseQueryFormats(window.location.search);
      const preset = q.to && options.some((o) => o.id === q.to) ? q.to : options[0]?.id ?? null;
      setToFormat(preset);
      setStage("ready");
      setError(null);
      setResult(null);
      persistWorkspaceOutput(saveSession, {
        filename: f.name,
        toolSlug: "universal-converter",
        toolLabel: "Universal Converter",
        data: f,
      });
    },
    [canUse, saveSession, t],
  );

  async function handleConvert() {
    if (!file || !fromFormat || !toFormat) return;
    setStage("converting");
    setProgress(0);
    setError(null);
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      await runTieredThenCleanup(
        [file],
        {
          onProgress: (u, total) => {
            const safe = Math.max(total, 1);
            setProgress((p) => nextProgress(p, Math.round((u / safe) * 55)));
          },
        },
        async () => {
          timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 6, 92))), 200);
          const out = await withMinimumDuration(runUniversalConversion(file, fromFormat, toFormat));
          window.clearInterval(timer!);
          timer = null;
          setProgress(100);
          setResult(out);
          setProcessedFile({
            blob: out.blob,
            filename: out.filename,
            tool: "Universal Converter",
            toolSlug: "universal-converter",
            originalSize: file.size,
            processedSize: out.blob.size,
          });
          persistWorkspaceOutput(saveSession, {
            filename: out.filename,
            toolSlug: "universal-converter",
            toolLabel: "Universal Converter",
            data: out.blob,
          });
          logToolSuccess("universal-converter", { from: fromFormat, to: toFormat });
          setStage("done");
        },
      );
    } catch (e) {
      logToolError("universal-converter", "convert", e, { recoverable: true });
      setError(conversionErrorMessage(e, t));
      setStage("ready");
    } finally {
      if (timer) window.clearInterval(timer);
    }
  }

  function reset() {
    setFile(null);
    setFromFormat(null);
    setToFormat(null);
    setStage("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    setProcessedFile(null);
  }

  const targetPicker =
    fromFormat && targets.length > 0 ? (
      <div className="grid grid-cols-2 gap-2 max-h-[min(50vh,280px)] overflow-y-auto overscroll-contain pr-1">
        {targets.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setToFormat(opt.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${
              toFormat === opt.id
                ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                : "border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <span className="text-xl" aria-hidden>
              {opt.icon}
            </span>
            <span className="text-xs font-semibold">{opt.label}</span>
          </button>
        ))}
      </div>
    ) : null;

  const converterGrid = (
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-3xl border border-border bg-card/80 p-5 sm:p-6 shadow-lg shadow-slate-900/5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("universalConverter.from", { defaultValue: "From" })}
            </p>
            {!file ? (
              <>
                {queryPreset.from && queryPreset.to ? (
                  <p className="mb-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                    {t("universalConverter.queryPreset", {
                      defaultValue: "Upload a {{from}} file to convert to {{to}}.",
                      from: formatLabel(queryPreset.from),
                      to: formatLabel(queryPreset.to),
                    })}
                  </p>
                ) : null}
                <DropZone
                  onFiles={handleFiles}
                  accept={ACCEPT}
                  multiple={false}
                  label={t("universalConverter.dropLabel", { defaultValue: "Drag & drop or click to upload" })}
                  sublabel={t("universalConverter.dropSub", {
                    defaultValue: "PDF, images, Excel, HEIC, WebP, and more",
                  })}
                />
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
                    {formatLabel(fromFormat!).slice(0, 3)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · {formatLabel(fromFormat!)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {t("universalConverter.changeFile", { defaultValue: "Change" })}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-5 sm:p-6 shadow-lg shadow-slate-900/5 backdrop-blur-sm flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("universalConverter.to", { defaultValue: "Convert to" })}
            </p>
            {!fromFormat ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                <FileType className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t("universalConverter.pickFileFirst", { defaultValue: "Upload a file to see conversion options" })}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block">{targetPicker}</div>
                <button
                  type="button"
                  disabled={!file || !toFormat || stage === "converting"}
                  onClick={() => void handleConvert()}
                  className="mt-6 hidden w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none lg:flex"
                >
                  {stage === "converting" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t("universalConverter.converting", { defaultValue: "Converting…" })} {progress}%
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      {t("universalConverter.convert", { defaultValue: "Convert securely" })}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
  );

  const desktop = (
    <div className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-muted/40 via-background to-background">
      <ToolSEO
        title="Secure Any-to-Any File Converter"
        description="Convert PDF, Word, Excel, HEIC, WebP, JPG, and PNG files privately in your browser. No uploads to servers — fast client-side processing."
        slug="universal-converter"
        lang={i18n.language}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("universalConverter.badge", { defaultValue: "Universal Converter" })}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("universalConverter.title", { defaultValue: "Secure Any-to-Any File Converter" })}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t("universalConverter.subtitle", {
              defaultValue:
                "Drop any supported file — we detect the format and show smart conversion options.",
            })}
          </p>
        </div>
        {converterGrid}
        {error ? (
          <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {result && stage === "done" ? (
          <div className="mt-8">
            <ToolResultPanel
              blob={result.blob}
              filename={result.filename}
              title={t("universalConverter.resultTitle", { defaultValue: "Conversion complete" })}
              onProcessAnother={reset}
            />
          </div>
        ) : null}
        <div className="mt-8">
          <TrustShieldPrivacyNotice />
        </div>
      </div>
    </div>
  );

  const mobile = (
    <MobileToolLayout
      slug="universal-converter"
      toolLabel="Universal Converter"
      title={t("universalConverter.title", { defaultValue: "Universal Converter" })}
      workflowStep={stage === "done" ? "done" : file ? "configure" : "upload"}
      settingsPanel={file ? targetPicker : undefined}
      processButton={
        file && toFormat && stage !== "done" ? (
          <button
            type="button"
            disabled={stage === "converting"}
            onClick={() => void handleConvert()}
            className={TOOL_PRIMARY_BTN}
          >
            {stage === "converting" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {progress}%
              </>
            ) : (
              t("universalConverter.convert", { defaultValue: "Convert" })
            )}
          </button>
        ) : null
      }
      postProcessPanel={
        result && stage === "done" ? (
          <MobilePostProcessPanel
            currentSlug="universal-converter"
            onDownload={() => void safeDownloadBlob(result.blob, result.filename)}
            onProcessAnother={reset}
          />
        ) : undefined
      }
    >
      <ToolSEO
        title="Universal Converter"
        description="Convert files privately in your browser."
        slug="universal-converter"
        lang={i18n.language}
      />
      {!file ? (
        <ToolUploadSlot
          files={[]}
          onFiles={handleFiles}
          accept={ACCEPT}
          label={t("universalConverter.dropLabel", { defaultValue: "Upload a file" })}
          sublabel={t("universalConverter.dropSub", { defaultValue: "PDF, images, Office, and more" })}
        />
      ) : (
        <p className="mb-3 truncate text-sm font-medium text-foreground">{file.name}</p>
      )}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </MobileToolLayout>
  );

  return (
    <ToolRenderErrorBoundary onReset={reset}>
      <ToolPageSplit desktop={desktop} mobile={mobile} />
    </ToolRenderErrorBoundary>
  );
}

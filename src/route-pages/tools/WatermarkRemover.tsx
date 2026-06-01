import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { WandSparkles, Sparkles, Download, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePremium } from "@/context/PremiumContext";
import ToolSEO from "@/components/ToolSEO";
import { getAllPagesAsImages } from "@/tools/pdf-to-image/logic";
import { fileToDataUrl, rebuildPdfFromPageImages } from "@/tools/watermark-remover/apiClient";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import {
  eraseWatermarkInBrowser,
  type MaskRect,
} from "@/tools/watermark-remover/browserErase";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";

const MAX_BROWSER_PDF_PAGES = 60;

type Mode = "auto" | "manual";

type OutputState =
  | { kind: "none" }
  | { kind: "image"; before: string; after: string; fileName: string }
  | { kind: "pdf"; blob: Blob; fileName: string; pageCount: number };

function downloadBlob(blob: Blob, filename: string) {
  void safeDownloadBlob(blob, filename);
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isImage(file: File): boolean {
  return /^image\//.test(file.type) || /\.(png|jpe?g)$/i.test(file.name);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] || "application/octet-stream";
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

export default function WatermarkRemover() {
  const { i18n, t } = useTranslation();
  const { canUse, getLimits } = usePremium();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [manualRect, setManualRect] = useState<MaskRect>({ xPct: 64, yPct: 8, wPct: 28, hPct: 14 });
  const [processing, setProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [output, setOutput] = useState<OutputState>({ kind: "none" });

  const limits = getLimits("remove-watermark");
  const sizeMb = file ? file.size / (1024 * 1024) : 0;
  const fileType = file ? (isPdf(file) ? "pdf" : isImage(file) ? "image" : "unsupported") : "none";

  const access = useMemo(() => {
    if (!file) return { blocked: false, reason: "" };
    const check = canUse(1, sizeMb, "remove-watermark", { largestFileMB: sizeMb });
    return { blocked: !check.allowed, reason: check.reason ?? "" };
  }, [canUse, file, sizeMb]);

  async function processImageInBrowser(dataUrl: string, fileName: string) {
    setProgressLabel("Applying local spot repair in your browser…");
    const after = await eraseWatermarkInBrowser(dataUrl, mode, manualRect);
    setOutput({
      kind: "image",
      before: dataUrl,
      after,
      fileName: fileName.replace(/\.[^.]+$/, "") + "-cleaned.png",
    });
  }

  async function processPdfInBrowser(pdf: File) {
    setProgressLabel("Rendering PDF pages…");
    const pages = await getAllPagesAsImages(pdf, 2.3, "png");
    if (pages.length > MAX_BROWSER_PDF_PAGES) {
      throw new Error(`This tool processes up to ${MAX_BROWSER_PDF_PAGES} pages in the browser. Split the PDF and run again.`);
    }
    const processed: string[] = [];
    for (let i = 0; i < pages.length; i += 1) {
      setProgressLabel(`Cleaning page ${i + 1}/${pages.length}…`);
      processed.push(await eraseWatermarkInBrowser(pages[i], mode, manualRect));
    }
    setProgressLabel("Building PDF with PDFTrusted Core…");
    const blob = await rebuildPdfFromPageImages(processed);
    setOutput({
      kind: "pdf",
      blob,
      fileName: pdf.name.replace(/\.pdf$/i, "") + "-cleaned.pdf",
      pageCount: processed.length,
    });
  }

  async function runLocalRepair() {
    if (!file) return;
    if (access.blocked) {
      setError(access.reason);
      return;
    }
    if (fileType === "unsupported") {
      setError("Only JPG, PNG, and PDF files are supported.");
      return;
    }

    setError(null);
    setAdvice(
      "All processing runs offline in your browser with PDFTrusted Core. Results depend on watermark contrast; there is no generative AI inpainting.",
    );
    setOutput({ kind: "none" });
    setProcessing(true);
    try {
      await runTieredThenCleanup(file ? [file] : [], {}, async () => {
        if (isImage(file)) {
          const source = await fileToDataUrl(file);
          await processImageInBrowser(source, file.name);
        } else if (isPdf(file)) {
          await processPdfInBrowser(file);
        }
      });
      toast.success("Spot repair finished.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
      setProgressLabel("");
    }
  }

  const desktop = (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ToolSEO
        title="Spot repair — local watermark touch-up | PDFTrusted"
        description="Remove or soften flat watermarks on images and PDFs using offline browser processing with PDFTrusted Core. No cloud AI."
        slug="remove-watermark"
        lang={i18n.language}
      />

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.55)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 15% 8%, hsl(var(--primary)/0.2), transparent 60%), radial-gradient(ellipse 65% 35% at 82% 20%, hsl(var(--primary)/0.15), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/15 p-2.5 text-primary">
                <WandSparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Spot repair (offline)</h1>
                <p className="text-sm text-muted-foreground">
                  Local JPG/PNG/PDF cleanup — browser-based repair with PDFTrusted Core. No server AI.
                </p>
              </div>
            </div>
            <div className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              Up to {limits.maxFileSizeMB}MB · max {MAX_BROWSER_PDF_PAGES} PDF pages
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {advice && (
            <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              {advice}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <ToolUploadSlot
                files={file ? [file] : []}
                onFiles={(files) => {
                  const picked = files[0];
                  if (!picked) {
                    setFile(null);
                    setOutput({ kind: "none" });
                    return;
                  }
                  setFile(picked);
                  setOutput({ kind: "none" });
                  setError(null);
                  setAdvice(null);
                }}
                onRemoveFile={() => {
                  setFile(null);
                  setOutput({ kind: "none" });
                  setError(null);
                  setAdvice(null);
                }}
                multiple={false}
                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg"
                label="Drop PDF, JPG, or PNG"
                sublabel="Preview your file, adjust the mask if needed, then run offline repair."
              />

              {processing ? (
                <div className="space-y-3 rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{progressLabel || "Working…"}</span>
                  </div>
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-28 w-full rounded-2xl" />
                </div>
              ) : (
                <Button
                  className="h-11 w-full rounded-xl text-[15px] font-semibold"
                  onClick={() => void runLocalRepair()}
                  disabled={!file || access.blocked}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run offline repair
                </Button>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-background/60 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mask & mode</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("auto")}
                  className={`rounded-xl border px-3 py-2 text-sm ${mode === "auto" ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`rounded-xl border px-3 py-2 text-sm ${mode === "manual" ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}
                >
                  Manual mask
                </button>
              </div>

              {mode === "manual" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Region as % of image (good for corner stamps).</p>
                  {(["xPct", "yPct", "wPct", "hPct"] as const).map((key) => (
                    <label key={key} className="block text-xs text-muted-foreground">
                      {key}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={manualRect[key]}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setManualRect((prev) => ({ ...prev, [key]: value }));
                        }}
                        className="mt-1 w-full"
                      />
                    </label>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-border bg-card/80 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Removed from this project</p>
                <ul className="mt-1 list-disc pl-4">
                  <li>Cloud AI inpainting and document APIs</li>
                </ul>
              </div>
            </div>
          </div>

          {output.kind === "image" && (
            <div className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/70 p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">Source preview</p>
                  <img src={output.before} alt="Before" className="max-h-[360px] w-full rounded-xl object-contain" />
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">Result preview</p>
                  <img src={output.after} alt="After" className="max-h-[360px] w-full rounded-xl object-contain" />
                  <Button
                    onClick={() => downloadBlob(dataUrlToBlob(output.after), output.fileName)}
                    className="mt-3 h-10 w-full rounded-xl"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                </div>
              </div>
            </div>
          )}

          {output.kind === "pdf" && (
            <div className="mt-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Cleaned PDF ({output.pageCount} pages). Use preview to verify, then download.
              </p>
              <ToolResultPanel
                blob={output.blob}
                filename={output.fileName}
                title="Result preview"
                onProcessAnother={() => {
                  setFile(null);
                  setOutput({ kind: "none" });
                  setAdvice(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );

  const mobile = (
    <MobileToolLayout
      slug="remove-watermark"
      toolLabel="Spot repair"
      title="Spot repair"
      workflowStep={output.kind !== "none" ? "done" : file ? "configure" : "upload"}
      processButton={
        file && output.kind === "none" ? (
          <button type="button" disabled={processing} onClick={() => void runLocalRepair()} className={TOOL_PRIMARY_BTN}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progressLabel || "Processing…"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run repair
              </>
            )}
          </button>
        ) : null
      }
      postProcessPanel={
        output.kind === "pdf" ? (
          <MobilePostProcessPanel
            currentSlug="remove-watermark"
            onDownload={() => downloadBlob(output.blob, output.fileName)}
            onProcessAnother={() => {
              setFile(null);
              setOutput({ kind: "none" });
            }}
          />
        ) : output.kind === "image" ? (
          <MobilePostProcessPanel
            currentSlug="remove-watermark"
            onDownload={() => downloadBlob(dataUrlToBlob(output.after), output.fileName)}
            onProcessAnother={() => {
              setFile(null);
              setOutput({ kind: "none" });
            }}
          />
        ) : undefined
      }
    >
      <ToolSEO title="Spot repair" description="Local watermark touch-up" slug="remove-watermark" lang={i18n.language} />
      <ToolUploadSlot
        files={file ? [file] : []}
        onFiles={(files) => {
          const picked = files[0];
          if (!picked) {
            setFile(null);
            setOutput({ kind: "none" });
            return;
          }
          setFile(picked);
          setOutput({ kind: "none" });
          setError(null);
        }}
        accept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg"
        label="Upload image or PDF"
        onRemoveFile={() => {
          setFile(null);
          setOutput({ kind: "none" });
        }}
      />
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </MobileToolLayout>
  );

  return <ToolPageSplit desktop={desktop} mobile={mobile} />;
}

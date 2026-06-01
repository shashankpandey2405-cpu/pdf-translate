import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Download, FileText, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flushRegisteredStagedKeys } from "@/lib/stagedFileRegistry";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { DocxHtmlPreview } from "@/components/tools/DocxHtmlPreview";
import { PdfScrollPreview } from "@/components/tools/PdfScrollPreview";
import { ToolFilePreviewPane } from "@/components/tools/ToolFilePreviewPane";
import { ToolSourceFilesStrip } from "@/components/tools/ToolSourceFilesStrip";
import { blobToPreviewSource } from "@/components/tools/filePreviewUtils";
import { isDocxFilename } from "@/lib/docx/docxToPreviewHtml";
import { ProcessingPathResultBanner } from "@/components/processing/ProcessingPathResultBanner";
import { PostResultSignupNudge } from "@/components/conversion/PostResultSignupNudge";
import { ResultReadyLockBanner, ResultReadyReveal } from "@/components/conversion/ResultReadyReveal";
import { cn } from "@/lib/utils";
import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import { useHydrated } from "@/hooks/useHydrated";
import { usePremium } from "@/context/PremiumContext";
import { recordGuestToolSuccess } from "@/lib/conversion/guestEngagement";
import { logConversionEvent } from "@/utils/logger";

type ToolResultPanelBaseProps = {
  title?: string;
  onProcessAnother: () => void;
  className?: string;
  /** When true, suppresses the bottom banner near download (workflow phases that should stay ad-free). */
  hideFooterAd?: boolean;
  /** Skip the guest progress-lock (parent handles reveal). */
  skipResultLock?: boolean;
  /** When skipResultLock, parent controls download visibility. */
  resultRevealed?: boolean;
  /** Hide post-result signup nudge (parent shows its own). */
  hideSignupNudge?: boolean;
  /** When "rail", download/share/process-another live in the right options panel (mobile sheet / desktop rail). */
  actionsPlacement?: "inline" | "rail";
};

export type ToolResultPanelSingleProps = ToolResultPanelBaseProps & {
  mode?: "single";
  blob: Blob;
  filename: string;
  /** Original upload — enables before/after preview when set. */
  sourceFile?: File | null;
  /** Multiple inputs (e.g. merge) — shows source strip + output preview. */
  sourceFiles?: File[];
  /** Where processing ran — shown on result for trust. */
  executedVia?: "browser" | "cloud";
  toolSlug?: string;
};

export type ToolResultPanelGalleryItem = {
  /** Data URL or remote URL for the image (already in memory). */
  dataUrl: string;
  filename: string;
};

export type ToolResultPanelGalleryProps = ToolResultPanelBaseProps & {
  mode: "gallery";
  items: ToolResultPanelGalleryItem[];
  /** Optional descriptor used in helper text (e.g. "12 images"). */
  itemLabel?: string;
};

export type ToolResultPanelBundleProps = ToolResultPanelBaseProps & {
  mode: "bundle";
  blob: Blob;
  filename: string;
  fileCount: number;
};

export type ToolResultPanelProps =
  | ToolResultPanelSingleProps
  | ToolResultPanelGalleryProps
  | ToolResultPanelBundleProps;

function inferMime(blob: Blob, filename: string): string {
  if (blob.type && blob.type !== "application/octet-stream") return blob.type;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".rtf")) return "application/rtf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "application/octet-stream";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return blob.type || "application/octet-stream";
}

async function shareResult(filename: string, blob: Blob) {
  await shareBlob(blob, filename);
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function stagingCleanupThenDownload(blob: Blob, filename: string) {
  await flushRegisteredStagedKeys();
  await safeDownloadBlob(blob, filename);
}

/**
 * Post-process step: embedded preview of the output file + primary download.
 * Three modes:
 *  - `single` (default): one Blob with inline PDF/image preview.
 *  - `gallery`: list of image data URLs (e.g. per-page exports) with per-item + Download all.
 *  - `bundle`: ZIP / archive output with a file-count badge.
 */
export function ToolResultPanel(props: ToolResultPanelProps) {
  if (props.mode === "gallery") return <ToolResultGallery {...props} />;
  if (props.mode === "bundle") return <ToolResultBundle {...props} />;
  return <ToolResultSingle {...props} />;
}

function ToolResultSingle({
  blob,
  filename,
  title = "Result preview",
  sourceFile,
  sourceFiles,
  executedVia,
  toolSlug,
  onProcessAnother,
  className,
  hideFooterAd = false,
  skipResultLock = false,
  resultRevealed = true,
  hideSignupNudge = false,
  actionsPlacement = "inline",
}: ToolResultPanelSingleProps) {
  const multiSources = sourceFiles && sourceFiles.length > 1 ? sourceFiles : null;
  const singleSource = sourceFile ?? (sourceFiles?.length === 1 ? sourceFiles[0] : null);
  /** After processing: show output only (no side-by-side before/after). */
  const showComparison = false;
  const isLg = useIsLgDesktop();
  const hydrated = useHydrated();
  const hideInlinePreview = hydrated && !isLg;
  const mime = useMemo(() => inferMime(blob, filename), [blob, filename]);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const { isSignedIn } = usePremium();

  const trackGuestDownload = useCallback(() => {
    if (isSignedIn || !toolSlug) return;
    recordGuestToolSuccess(toolSlug);
    logConversionEvent("guest_tool_download", { tool_slug: toolSlug, executed_via: executedVia ?? "browser" });
  }, [isSignedIn, toolSlug, executedVia]);

  const downloadResult = useCallback(async () => {
    trackGuestDownload();
    await stagingCleanupThenDownload(blob, filename);
  }, [trackGuestDownload, blob, filename]);

  useEffect(() => {
    if (hideInlinePreview) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob, hideInlinePreview]);

  useEffect(() => {
    void flushRegisteredStagedKeys();
  }, [blob, filename]);

  const isPdf = mime === "application/pdf";
  const isImage = mime.startsWith("image/");
  const isDocx = isDocxFilename(filename) || mime.includes("wordprocessingml");

  const panelBody = (revealed: boolean) => (
    <div className={className ?? "mt-8 w-full min-w-0 max-w-full space-y-4 rounded-3xl border border-border bg-card p-4 sm:p-6"}>
      {executedVia && toolSlug ? (
        <ProcessingPathResultBanner slug={toolSlug} executedVia={executedVia} />
      ) : null}
      {!revealed ? <ResultReadyLockBanner /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[min(100%,28rem)]">{filename}</p>
          </div>
        </div>
        {actionsPlacement === "inline" ? (
          <div
            className={cn(
              "flex flex-wrap gap-2 transition-opacity duration-300",
              !revealed && "pointer-events-none opacity-40",
            )}
          >
            <Button type="button" variant="outline" size="sm" onClick={onProcessAnother} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Process another
            </Button>
            {revealed ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-[44px] gap-2"
                  onClick={() => void downloadResult()}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] gap-2"
                  onClick={() => void shareResult(filename, blob)}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            ) : null}
          </div>
        ) : revealed ? (
          <p className="text-xs font-medium text-primary">Download &amp; share → open options (gear)</p>
        ) : null}
      </div>

      {blob.size > 0 ? (
        <p className="text-xs text-muted-foreground">{formatBytes(blob.size)}</p>
      ) : null}

      {multiSources && !hideInlinePreview ? (
        <div className="space-y-4">
          <ToolSourceFilesStrip files={multiSources} label="Before (source files)" />
          <ToolFilePreviewPane {...blobToPreviewSource(blob, filename, "After")} toolSlug={toolSlug} />
        </div>
      ) : null}

      {hideInlinePreview ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
          File ready — use Download above. Preview is available on desktop.
        </p>
      ) : null}

      <div
        className={cn(
          multiSources || hideInlinePreview ? "hidden" : "overflow-hidden rounded-2xl border border-border bg-muted/30",
          !revealed && "pointer-events-none select-none opacity-75 blur-[1px]",
        )}
      >
        {isPdf ? (
          <div className="pdf-preview-container max-h-[min(70vh,720px)] touch-pan-y overflow-y-auto overscroll-y-auto">
            <PdfScrollPreview blob={blob} filename={filename} maxWidth={560} fullPage />
          </div>
        ) : !objectUrl ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">Preparing preview…</div>
        ) : isImage ? (
          <div className="pdf-preview-page flex max-h-[min(70vh,720px)] touch-pan-y items-center justify-center overflow-auto overscroll-y-auto p-4">
            <img
              src={objectUrl}
              alt="Processed output preview"
              width={560}
              height={720}
              className="max-h-full max-w-full touch-pan-y object-contain"
              draggable={false}
            />
          </div>
        ) : isDocx ? (
          <div className="max-h-[min(70vh,720px)] overflow-auto">
            <DocxHtmlPreview blob={blob} />
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
            <p>Preview is not available for this file type.</p>
            {objectUrl ? (
              <Button
                type="button"
                size="sm"
                className="min-h-[44px]"
                onClick={() => void downloadResult()}
              >
                <Download className="mr-2 inline h-4 w-4" />
                Download file
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {revealed && !hideSignupNudge ? <PostResultSignupNudge /> : null}
    </div>
  );

  if (skipResultLock || executedVia === "browser") return panelBody(resultRevealed);

  return (
    <ResultReadyReveal active={blob.size > 0}>
      {panelBody}
    </ResultReadyReveal>
  );
}

function ToolResultGallery({
  items,
  title = "Result preview",
  itemLabel = "items",
  onProcessAnother,
  className,
  hideFooterAd = false,
}: ToolResultPanelGalleryProps) {
  useEffect(() => {
    if (items.length) void flushRegisteredStagedKeys();
  }, [items.length]);

  async function downloadAll() {
    await flushRegisteredStagedKeys();
    for (let idx = 0; idx < items.length; idx += 1) {
      const item = items[idx]!;
      const res = await fetch(item.dataUrl);
      const blob = await res.blob();
      await safeDownloadBlob(blob, item.filename);
      await new Promise((r) => window.setTimeout(r, 400));
    }
  }

  return (
    <div className={className ?? "mt-8 space-y-4 rounded-3xl border border-border bg-card p-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {items.length} {itemLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onProcessAnother} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Process another
          </Button>
          <Button type="button" size="sm" onClick={downloadAll} className="gap-2" disabled={items.length === 0}>
            <Download className="h-4 w-4" />
            Download all
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
        {items.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">No items to preview.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, idx) => (
              <div
                key={`${item.filename}-${idx}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-background"
              >
                <img
                  src={item.dataUrl}
                  alt={item.filename}
                  width={240}
                  height={320}
                  className="aspect-[3/4] w-full object-contain"
                  loading={idx < 6 ? "eager" : "lazy"}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/90 px-3 py-2 text-xs">
                  <span className="truncate text-foreground">{item.filename}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      void (async () => {
                        const res = await fetch(item.dataUrl);
                        const blob = await res.blob();
                        await stagingCleanupThenDownload(blob, item.filename);
                      })();
                    }}
                    className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-white hover:bg-primary/90"
                  >
                    <Download className="h-3 w-3" />
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolResultBundle({
  blob,
  filename,
  fileCount,
  title = "Result preview",
  onProcessAnother,
  className,
  hideFooterAd = false,
}: ToolResultPanelBundleProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const sizeText = useMemo(() => formatBytes(blob.size), [blob]);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  useEffect(() => {
    void flushRegisteredStagedKeys();
  }, [blob, filename]);

  return (
    <div className={className ?? "mt-8 space-y-4 rounded-3xl border border-border bg-card p-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Archive className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[min(100%,28rem)]">{filename}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {fileCount} file{fileCount === 1 ? "" : "s"}
              {sizeText ? ` · ${sizeText}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onProcessAnother} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Process another
          </Button>
          {objectUrl ? (
            <Button
              type="button"
              size="sm"
              className="min-h-[44px] gap-2"
              onClick={() => void safeDownloadBlob(blob, filename)}
            >
              <Download className="h-4 w-4" />
              Download bundle
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        <p>
          {fileCount} processed file{fileCount === 1 ? "" : "s"} packaged into a single archive for download. Extract locally to inspect each file.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { DocxHtmlPreview } from "@/components/tools/DocxHtmlPreview";
import { PdfScrollPreview } from "@/components/tools/PdfScrollPreview";
import { formatPreviewBytes, inferPreviewMime, type FilePreviewSource } from "@/components/tools/filePreviewUtils";
import { cn } from "@/lib/utils";
import { isDocxFilename } from "@/lib/docx/docxToPreviewHtml";
import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import { useHydrated } from "@/hooks/useHydrated";
import { allowsInlineMobilePreview } from "@/lib/mobile/previewPolicy";

type Props = FilePreviewSource & {
  compact?: boolean;
  /** Fit entire first page without cropping (configure / ready step) */
  fullPage?: boolean;
  /** PDF only: `paged` = one page per scroll viewport */
  previewLayout?: "stack" | "paged";
  className?: string;
  /** AI modal preview only — skips mobile inline block. */
  allowMobilePreview?: boolean;
  toolSlug?: string;
};

/** Single-pane inline preview for PDF, images, or file-type placeholder. */
export function ToolFilePreviewPane({
  label,
  blob,
  filename,
  compact = false,
  fullPage = false,
  previewLayout = "stack",
  className,
  allowMobilePreview = false,
  toolSlug,
}: Props) {
  const isLg = useIsLgDesktop();
  const hydrated = useHydrated();
  const blockMobilePreview =
    hydrated && !isLg && !allowsInlineMobilePreview({ toolSlug, force: allowMobilePreview });

  const mime = useMemo(() => inferPreviewMime(blob, filename), [blob, filename]);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const isPdf = mime === "application/pdf";
  const isImage = mime.startsWith("image/");
  const isDocx =
    mime.includes("wordprocessingml") || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || isDocxFilename(filename);
  const pagedPdf = isPdf && previewLayout === "paged";
  const frameMinH = pagedPdf
    ? "min-h-[min(52vh,420px)] h-full"
    : compact
      ? "min-h-[200px]"
      : fullPage
        ? "min-h-0"
        : "min-h-[220px]";
  const previewFrameClass = pagedPdf
    ? "h-full min-h-0 w-full flex-1"
    : compact
      ? "h-[min(42vh,380px)]"
      : fullPage
        ? "min-h-0 w-full"
        : "h-[min(50vh,420px)]";

  useEffect(() => {
    if (isPdf || blockMobilePreview) return;
    setImagePreviewFailed(false);
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob, isPdf, filename, blockMobilePreview]);

  if (blockMobilePreview) {
    return (
      <div
        className={cn(
          "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center",
          className,
        )}
      >
        <FileText className="h-8 w-8 text-muted-foreground/50" aria-hidden />
        <p className="max-w-[240px] truncate text-xs font-medium text-foreground">{filename}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatPreviewBytes(blob.size)} · Preview available on desktop
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pdf-preview-container flex w-full max-w-full touch-pan-y flex-col overflow-hidden rounded-2xl border border-border bg-muted/20",
        pagedPdf ? "h-full min-h-[min(52vh,420px)]" : "min-h-0",
        className,
      )}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{filename}</p>
        <p className="text-[11px] text-muted-foreground">{formatPreviewBytes(blob.size)}</p>
      </div>
      <div
        className={cn(
          "flex flex-1 touch-pan-y flex-col",
          pagedPdf
            ? "min-h-0 overflow-hidden overscroll-y-auto"
            : fullPage
              ? "overflow-visible"
              : "overflow-y-auto overscroll-y-auto",
          frameMinH,
        )}
      >
        {isPdf ? (
          <PdfScrollPreview
            blob={blob}
            filename={filename}
            className={previewFrameClass}
            maxWidth={fullPage || pagedPdf ? 720 : compact ? 360 : 520}
            fullPage={fullPage}
            layout={previewLayout}
          />
        ) : !objectUrl ? (
          <div className={`flex ${frameMinH} items-center justify-center text-xs text-muted-foreground`}>
            Loading preview…
          </div>
        ) : isImage && !imagePreviewFailed ? (
          <div className={`pdf-preview-page flex ${previewFrameClass} touch-pan-y items-center justify-center p-3`}>
            <img
              src={objectUrl}
              alt={label}
              className="max-h-full max-w-full touch-pan-y object-contain"
              draggable={false}
              onError={() => setImagePreviewFailed(true)}
            />
          </div>
        ) : isImage && imagePreviewFailed ? (
          <div
            className={`flex ${frameMinH} flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground`}
          >
            <FileText className="h-8 w-8 text-primary/60" aria-hidden />
            <p>
              This image format cannot be previewed in the browser (e.g. HEIC). Processing will still work.
            </p>
          </div>
        ) : isDocx ? (
          <div className={`${previewFrameClass} overflow-auto`}>
            <DocxHtmlPreview blob={blob} />
          </div>
        ) : (
          <div
            className={`flex ${frameMinH} flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground`}
          >
            <FileText className="h-8 w-8 text-primary/60" aria-hidden />
            <p>Inline preview is not available for this file type. Processing will still work.</p>
          </div>
        )}
      </div>
    </div>
  );
}

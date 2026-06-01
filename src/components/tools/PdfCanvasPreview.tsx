"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { renderPDFPage } from "@/components/PDFThumbnail";
import { cn } from "@/lib/utils";

type Props = {
  blob: Blob;
  filename?: string;
  pageNumber?: number;
  className?: string;
  /** Max width in CSS pixels for thumbnail scale */
  maxWidth?: number;
  /** Show full page height (no max-height crop) — for configure step */
  fullPage?: boolean;
};

function blobToPreviewFile(blob: Blob, filename = "preview.pdf"): File {
  if (blob instanceof File) return blob;
  return new File([blob], filename, { type: blob.type || "application/pdf" });
}

/**
 * Renders PDF page 1 to canvas (works on iOS Safari where blob iframes often fail).
 */
export function PdfCanvasPreview({
  blob,
  filename = "preview.pdf",
  pageNumber = 1,
  className,
  maxWidth = 480,
  fullPage = false,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    setFailed(false);
    setDataUrl(null);

    const file = blobToPreviewFile(blob, filename);
    const scale = Math.min(Math.max(maxWidth / 210, 0.35), fullPage ? 2 : 1.2);

    void renderPDFPage(file, pageNumber, scale)
      .then((url) => {
        if (!mounted.current) return;
        setDataUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted.current) return;
        setFailed(true);
        setLoading(false);
      });

    return () => {
      mounted.current = false;
    };
  }, [blob, filename, pageNumber, maxWidth, fullPage]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center gap-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary/70" aria-hidden />
        Loading preview…
      </div>
    );
  }

  if (failed || !dataUrl) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] flex-col items-center justify-center gap-2 px-4 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        <FileText className="h-9 w-9 text-primary/50" aria-hidden />
        <p>Preview could not render in the browser. You can still process or download the file.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex justify-center bg-background/80 p-2 sm:p-3",
        fullPage ? "items-start" : "items-center",
        className,
      )}
    >
      <img
        src={dataUrl}
        alt={`Page ${pageNumber} preview`}
        className={cn(
          "w-full max-w-full rounded-lg object-contain shadow-sm",
          fullPage ? "h-auto max-h-none" : "max-h-[min(55vh,520px)]",
        )}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

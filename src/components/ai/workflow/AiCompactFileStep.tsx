"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPDFPageCount, renderPDFPage } from "@/components/PDFThumbnail";
import { isImageFile } from "@/lib/ocr/imageOcr";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/components/ai/workflow/types";

type Props = {
  file: File;
  onContinue: () => void;
  onRemove?: () => void;
  continueLabel?: string;
  className?: string;
};

/** Step 1 — filename, size, pages, compact preview only. */
export function AiCompactFileStep({
  file,
  onContinue,
  onRemove,
  continueLabel = "Continue",
  className,
}: Props) {
  const [pages, setPages] = useState<number | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setThumbUrl(url);
      setPages(1);
      return () => {
        cancelled = true;
        URL.revokeObjectURL(url);
      };
    }
    void getPDFPageCount(file)
      .then((n) => {
        if (!cancelled) setPages(n);
      })
      .catch(() => {
        if (!cancelled) setPages(null);
      });
    let previewUrl: string | null = null;
    void renderPDFPage(file, 1, 0.45)
      .then((url) => {
        if (cancelled) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          return;
        }
        previewUrl = url;
        setThumbUrl(url);
      })
      .catch(() => {
        /* preview optional */
      });
    return () => {
      cancelled = true;
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [file]);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">{file.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatFileSize(file.size)}
              {pages != null ? ` · ${pages} page${pages === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Remove
            </button>
          ) : null}
        </div>
        {thumbUrl ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border/50 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl} alt="" className="mx-auto max-h-36 w-auto object-contain" />
          </div>
        ) : (
          <div className="mt-4 flex h-28 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
            Loading preview…
          </div>
        )}
      </div>
      <Button type="button" size="lg" className="w-full rounded-xl" onClick={onContinue}>
        {continueLabel}
      </Button>
    </div>
  );
}

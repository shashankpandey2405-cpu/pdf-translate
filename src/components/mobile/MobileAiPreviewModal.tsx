"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfScrollPreview } from "@/components/tools/PdfScrollPreview";
import { ToolFilePreviewPane } from "@/components/tools/ToolFilePreviewPane";
import { fileToPreviewSource } from "@/components/tools/filePreviewUtils";
import { cn } from "@/lib/utils";

type BlobPreview = {
  kind: "blob";
  blob: Blob;
  filename: string;
};

type FilePreview = {
  kind: "file";
  file: File;
  label?: string;
};

type Props = {
  preview: BlobPreview | FilePreview;
  className?: string;
};

/** AI-only: preview hidden until user taps Preview; released on close. */
export function MobileAiPreviewModal({ preview, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("shrink-0", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 w-full gap-2 rounded-xl text-sm font-semibold"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-background/98 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Document preview"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <p className="text-sm font-bold text-foreground">Preview</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {preview.kind === "blob" ? (
              <PdfScrollPreview
                blob={preview.blob}
                filename={preview.filename}
                layout="paged"
                fullPage
                className="min-h-[50vh]"
              />
            ) : (
              <ToolFilePreviewPane
                {...fileToPreviewSource(preview.file, preview.label ?? "Your file")}
                fullPage
                allowMobilePreview
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

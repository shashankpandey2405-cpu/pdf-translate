"use client";

import { Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiFocusShell } from "@/components/ai/workflow/AiFocusShell";
import { SmartScanChatPanel } from "@/components/ai/smartscan/SmartScanChatPanel";
import { cn } from "@/lib/utils";

type Props = {
  fileName: string;
  pageCount: number | null;
  jobId: string | null;
  baseFilename: string;
  onRevisedPdf: (blob: Blob, filename: string) => void;
  onDownload: () => void;
  onExportWord: () => void;
  wordBusy: boolean;
  onStartOver: () => void;
  className?: string;
};

/** Step 4 — scan results only; no upload or preview panels. */
export function SmartScanResultFocus({
  fileName,
  pageCount,
  jobId,
  baseFilename,
  onRevisedPdf,
  onDownload,
  onExportWord,
  wordBusy,
  onStartOver,
  className,
}: Props) {
  return (
    <div className={cn("flex min-h-[calc(100vh-4rem)] flex-col", className)}>
      <header className="shrink-0 border-b border-border/60 bg-card/40 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Smart Scan Results</p>
            <p className="truncate text-sm font-semibold text-foreground">{fileName}</p>
            {pageCount != null ? (
              <p className="text-xs text-muted-foreground">
                {pageCount} page{pageCount === 1 ? "" : "s"} reconstructed
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" size="sm" className="gap-1.5 rounded-xl" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              disabled={wordBusy}
              onClick={onExportWord}
            >
              {wordBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Export Word
            </Button>
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 rounded-xl" onClick={onStartOver}>
              <RotateCcw className="h-3.5 w-3.5" />
              New scan
            </Button>
          </div>
        </div>
      </header>
      <AiFocusShell maxWidth="chat" className="flex-1 !justify-start py-4">
        <div className="flex h-[min(720px,calc(100dvh-11rem))] w-full flex-col">
          <SmartScanChatPanel
            jobId={jobId}
            baseFilename={baseFilename}
            onRevisedPdf={onRevisedPdf}
            className="h-full min-h-0"
          />
        </div>
      </AiFocusShell>
    </div>
  );
}

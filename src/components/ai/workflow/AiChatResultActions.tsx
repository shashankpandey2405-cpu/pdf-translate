"use client";

import { Copy, Download, FileDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onCopy?: () => void;
  onDownload?: () => void;
  onExport?: () => void;
  onReset?: () => void;
  copyLabel?: string;
  downloadLabel?: string;
  exportLabel?: string;
  resetLabel?: string;
  className?: string;
};

/** Compact action row for AI chat / scan result screens. */
export function AiChatResultActions({
  onCopy,
  onDownload,
  onExport,
  onReset,
  copyLabel = "Copy",
  downloadLabel = "Download",
  exportLabel = "Export",
  resetLabel = "New document",
  className,
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2 pt-4", className)}>
      {onCopy ? (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" />
          {copyLabel}
        </Button>
      ) : null}
      {onDownload ? (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
          {downloadLabel}
        </Button>
      ) : null}
      {onExport ? (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={onExport}>
          <FileDown className="h-3.5 w-3.5" />
          {exportLabel}
        </Button>
      ) : null}
      {onReset ? (
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 rounded-xl" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}

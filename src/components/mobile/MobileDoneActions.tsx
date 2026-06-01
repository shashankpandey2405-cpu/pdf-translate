"use client";

import { Download, RotateCcw, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onDownload?: () => void;
  onShare?: () => void;
  onProcessAnother?: () => void;
  downloadLabel?: string;
  className?: string;
};

export function MobileDoneActions({
  onDownload,
  onShare,
  onProcessAnother,
  downloadLabel = "Download",
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      {onDownload ? (
        <button
          type="button"
          onClick={onDownload}
          className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md"
        >
          <Download className="h-4 w-4" />
          {downloadLabel}
        </button>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        ) : null}
        {onProcessAnother ? (
          <button
            type="button"
            onClick={onProcessAnother}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold"
          >
            <RotateCcw className="h-4 w-4" />
            New file
          </button>
        ) : null}
      </div>
    </div>
  );
}

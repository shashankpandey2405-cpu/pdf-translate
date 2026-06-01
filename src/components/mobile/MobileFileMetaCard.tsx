"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  file: File;
  subtitle?: string;
  className?: string;
  onRemove?: () => void;
};

/** Lightweight file status — no PDF/canvas preview on mobile. */
export function MobileFileMetaCard({ file, subtitle, className, onRemove }: Props) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm",
        className,
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <FileText className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {subtitle ?? formatSize(file.size)}
        </p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-xs font-medium text-muted-foreground underline"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { CheckCircle2, FileText, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  file: File;
  onRemove?: () => void;
  className?: string;
  /** Hide green success badge (e.g. when parent already shows step bar). */
  showSuccessBadge?: boolean;
};

/** Single-file upload state — replaces dropzone placeholder after upload. */
export function ToolUploadedFileCard({ file, onRemove, className, showSuccessBadge = true }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "w-full max-w-full min-w-0 rounded-2xl border border-emerald-500/30 bg-card p-4 shadow-sm",
        className,
      )}
      data-testid="uploaded-file-card"
    >
      {showSuccessBadge ? (
        <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {t("toolWorkspace.uploadSuccess", { defaultValue: "Upload successful" })}
          </span>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            aria-label={t("toolWorkspace.removeFile", { defaultValue: "Remove file" })}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

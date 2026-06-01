"use client";

import { CheckCircle2, GripVertical, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import DropZone from "@/components/DropZone";
import { cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  files: File[];
  onAddFiles: (files: File[]) => void | Promise<void>;
  onRemoveAt: (index: number) => void;
  accept?: string;
  addLabel?: string;
  className?: string;
  /** Optional reorder handle slot per row */
  reorderHandle?: boolean;
};

/** Multi-file upload state — file list + add more (merge-style tools). */
export function ToolMultiFileStack({
  files,
  onAddFiles,
  onRemoveAt,
  accept = ".pdf,application/pdf",
  addLabel,
  className,
  reorderHandle = false,
}: Props) {
  const { t } = useTranslation();

  if (!files.length) {
    return (
      <DropZone
        onFiles={onAddFiles}
        multiple
        accept={accept}
        lockSuccess
        label={t("dropZone.dropPdfFiles", { defaultValue: "Drop files here" })}
        sublabel={t("dropZone.orClickBrowse", { defaultValue: "or click to browse" })}
        className={className}
      />
    );
  }

  return (
    <div className={cn("w-full min-w-0 space-y-3", className)} data-testid="multi-file-stack">
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-800 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-xs font-semibold">
          {t("toolWorkspace.filesReadyCount", {
            defaultValue: "{{count}} file(s) ready",
            count: files.length,
          })}
        </p>
      </div>

      <ul className="space-y-2">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${file.size}-${index}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            data-testid={`file-item-${index}`}
          >
            {reorderHandle ? (
              <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemoveAt(index)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
              aria-label={t("toolWorkspace.removeFile", { defaultValue: "Remove file" })}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <DropZone
        onFiles={onAddFiles}
        multiple
        accept={accept}
        lockSuccess
        label={addLabel ?? t("toolWorkspace.addMoreFiles", { defaultValue: "+ Add more files" })}
        sublabel={t("dropZone.orClickBrowse", { defaultValue: "or click to browse" })}
        className="min-h-[120px] !pt-10 !pb-10"
      />
    </div>
  );
}

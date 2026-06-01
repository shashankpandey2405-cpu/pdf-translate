"use client";

import { GripVertical, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  files: File[];
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
  className?: string;
};

/** Lightweight file reorder (no framer-motion) for merge configure step. */
export function MergeFileReorderList({ files, onReorder, onRemove, className }: Props) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${index}`}
          className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
          data-testid={`file-item-${index}`}
        >
          <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex shrink-0 flex-col gap-0.5">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={index === files.length - 1}
              onClick={() => move(index, index + 1)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            data-testid={`button-remove-file-${index}`}
            onClick={() => onRemove(index)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

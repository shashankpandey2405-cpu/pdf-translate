"use client";

import { useState } from "react";
import { Eye, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolFilePreviewPane } from "@/components/tools/ToolFilePreviewPane";
import { fileToPreviewSource } from "@/components/tools/filePreviewUtils";
import { allowsModalMobilePreview } from "@/lib/mobile/previewPolicy";
import { cn } from "@/lib/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  file: File;
  label?: string;
  className?: string;
  toolSlug?: string;
};

/** Legacy expandable preview — only for AI tools with explicit modal policy. */
export function MobileFilePreviewCard({ file, label = "Your file", className, toolSlug }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!allowsModalMobilePreview(toolSlug)) {
    return null;
  }

  return (
    <>
      {/* Compact card */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50",
          className,
        )}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Eye className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {/* Full preview overlay */}
      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <ToolFilePreviewPane {...fileToPreviewSource(file, label)} fullPage allowMobilePreview toolSlug={toolSlug} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

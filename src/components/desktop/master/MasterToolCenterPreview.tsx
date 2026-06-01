"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { formatPreviewBytes } from "@/components/tools/filePreviewUtils";
import { cn } from "@/lib/utils";

type Props = {
  file: File;
  files?: File[];
  className?: string;
};

/** Center workspace — file card on soft canvas (reference-style, PDFTrusted branding). */
export function MasterToolCenterPreview({ file, files, className }: Props) {
  const count = files?.length ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl bg-[hsl(210_28%_94%)]/80 p-5 min-h-0",
        className,
      )}
    >
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_64px_-28px_rgba(15,23,42,0.2)]">
          <div className="border-b border-border/60 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPreviewBytes(file.size)}
                  {count > 1 ? ` · ${count} files` : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <ToolInputPreview file={file} label="" compact className="min-h-[280px] w-full max-w-none" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

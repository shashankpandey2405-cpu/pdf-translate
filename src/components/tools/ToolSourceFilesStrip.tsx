"use client";

import PDFThumbnail from "@/components/PDFThumbnail";

type Props = {
  files: File[];
  label?: string;
  className?: string;
};

/** Multi-file input summary (e.g. merge) before processing. */
export function ToolSourceFilesStrip({ files, label = "Source files", className }: Props) {
  if (!files.length) return null;
  return (
    <div className={className ?? "rounded-2xl border border-border bg-muted/20 p-4"}>
      <p className="mb-3 text-xs font-semibold text-foreground">
        {label} ({files.length})
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {files.map((file, i) => (
          <div
            key={`${file.name}-${i}`}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2"
          >
            {file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf") ? (
              <PDFThumbnail file={file} width={72} className="rounded-lg" />
            ) : (
              <div className="flex h-[96px] w-[72px] items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                File
              </div>
            )}
            <span className="max-w-[88px] truncate text-[10px] text-muted-foreground">{file.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

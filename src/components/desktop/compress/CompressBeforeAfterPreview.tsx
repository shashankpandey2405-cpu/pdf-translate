"use client";

import { ArrowRight } from "lucide-react";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { formatPreviewBytes } from "@/components/tools/filePreviewUtils";
import { GlassPanel } from "@/components/desktop/GlassPanel";

type Props = {
  original: File;
  resultBlob: Blob;
  resultFilename: string;
};

export function CompressBeforeAfterPreview({ original, resultBlob, resultFilename }: Props) {
  const savedPct = Math.max(0, Math.round((1 - resultBlob.size / original.size) * 100));
  const resultFile = new File([resultBlob], resultFilename, {
    type: resultBlob.type || "application/pdf",
  });
  const lowSavings = savedPct < 5;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {lowSavings ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Browser mode only cleaned PDF structure (metadata). For real size reduction on scans and photos,
          run <strong>Trusted Cloud</strong> with OCR or standard cloud compression.
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <GlassPanel className="flex min-h-0 flex-col overflow-hidden p-3">
          <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Before
          </p>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ToolInputPreview
              file={original}
              label="Original"
              fullPage
              previewLayout="paged"
              className="h-[min(52vh,520px)] min-h-[280px] w-full max-w-none"
            />
          </div>
          <p className="mt-2 shrink-0 text-center text-xs text-muted-foreground">
            {formatPreviewBytes(original.size)}
          </p>
        </GlassPanel>

        <div className="flex items-center justify-center py-2 lg:py-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg lg:h-14 lg:w-14">
            <ArrowRight className="h-6 w-6 lg:h-7 lg:w-7" />
          </span>
        </div>

        <GlassPanel className="flex min-h-0 flex-col overflow-hidden p-3 ring-2 ring-emerald-500/20">
          <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            After
          </p>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ToolInputPreview
              file={resultFile}
              label="Compressed"
              fullPage
              previewLayout="paged"
              className="h-[min(52vh,520px)] min-h-[280px] w-full max-w-none"
            />
          </div>
          <p className="mt-2 shrink-0 text-center text-xs font-semibold text-emerald-700">
            {formatPreviewBytes(resultBlob.size)}
            {savedPct > 0 ? ` (−${savedPct}%)` : " (no size change)"}
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}

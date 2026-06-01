"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCw, RotateCcw, RefreshCw } from "lucide-react";
import { renderAllPages, getPDFPageCount } from "@/components/PDFThumbnail";
import { ToolModalSettingsBlock } from "@/components/tools/ToolModalSettingsBlock";
import type { RotationAngle } from "@/tools/rotate-pdf/logic";

type PageState = { rotation: number };

type Props = {
  file: File;
  pageStates: PageState[];
  setPageStates: React.Dispatch<React.SetStateAction<PageState[]>>;
  selected: Set<number>;
  setSelected: React.Dispatch<React.SetStateAction<Set<number>>>;
};

export function RotatePdfConfigurePanel({
  file,
  pageStates,
  setPageStates,
  selected,
  setSelected,
}: Props) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    setThumbnails([]);
    void getPDFPageCount(file).then((n) => {
      setPageCount(n);
      setPageStates(Array.from({ length: n }, () => ({ rotation: 0 })));
    });
    void renderAllPages(file, 0.5).then(setThumbnails);
  }, [file, setPageStates]);

  function togglePage(i: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function rotateSelected(angle: RotationAngle) {
    const targets =
      selected.size > 0 ? Array.from(selected) : Array.from({ length: pageCount }, (_, i) => i);
    setPageStates((prev) =>
      prev.map((p, i) => (targets.includes(i) ? { rotation: (p.rotation + angle) % 360 } : p)),
    );
  }

  return (
    <ToolModalSettingsBlock title="Rotate pages">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          {selected.size > 0 ? `${selected.size} selected` : "All pages"}
        </span>
        <button type="button" onClick={() => rotateSelected(90)} className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-medium">
          <RotateCw className="h-3.5 w-3.5" /> +90°
        </button>
        <button type="button" onClick={() => rotateSelected(270)} className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-medium">
          <RotateCcw className="h-3.5 w-3.5" /> -90°
        </button>
        <button type="button" onClick={() => rotateSelected(180)} className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-medium">
          <RefreshCw className="h-3.5 w-3.5" /> 180°
        </button>
        <button type="button" onClick={() => setSelected(new Set())} className="px-2 py-1 text-xs text-muted-foreground">
          Clear
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {thumbnails.length === 0
          ? Array.from({ length: Math.min(pageCount || 4, 8) }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))
          : thumbnails.map((thumb, i) => (
              <motion.button
                key={i}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => togglePage(i)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                  selected.has(i) ? "border-primary ring-2 ring-primary/30" : "border-border"
                }`}
              >
                <img
                  src={thumb}
                  alt={`Page ${i + 1}`}
                  className="aspect-[3/4] w-full object-cover transition-transform"
                  style={{ transform: `rotate(${pageStates[i]?.rotation ?? 0}deg)` }}
                />
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {i + 1}
                </span>
              </motion.button>
            ))}
      </div>
    </ToolModalSettingsBlock>
  );
}

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  thumbnails: string[];
  pageCount: number;
  loading?: boolean;
  selected: Set<number>;
  onToggle: (index: number) => void;
  /** Show drag handle (organize mode). */
  showGrip?: boolean;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  /** Highlight style for remove mode (selected = will delete). */
  variant?: "extract" | "remove" | "organize";
};

export function PdfPageThumbnailGrid({
  thumbnails,
  pageCount,
  loading,
  selected,
  onToggle,
  showGrip = false,
  variant = "extract",
}: Props) {
  const selectedRing =
    variant === "remove" ? "border-destructive shadow-destructive/20" : "border-primary shadow-primary/20";

  if (loading && !thumbnails.length) {
    return (
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: Math.min(pageCount || 6, 10) }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {thumbnails.map((thumb, i) => (
        <motion.button
          key={i}
          type="button"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: Math.min(i * 0.02, 0.4) }}
          onClick={() => onToggle(i)}
          className={cn(
            "relative flex flex-col items-center overflow-hidden rounded-xl border-2 transition-all touch-manipulation",
            selected.has(i) ? selectedRing : "border-border hover:border-primary/40",
          )}
        >
          {showGrip ? (
            <span className="absolute left-1 top-1 z-10 rounded bg-background/80 p-0.5 text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <img src={thumb} alt={`Page ${i + 1}`} className="w-full object-contain" loading="lazy" decoding="async" />
          {selected.has(i) ? (
            <div
              className={cn(
                "absolute inset-0 flex items-start justify-end p-1.5",
                variant === "remove" ? "bg-destructive/10" : "bg-primary/10",
              )}
            >
              <CheckCircle2
                className={cn("h-4 w-4", variant === "remove" ? "text-destructive" : "text-primary")}
              />
            </div>
          ) : null}
          <span className="absolute bottom-0 left-0 right-0 bg-background/90 py-1 text-center text-xs font-medium text-foreground">
            {i + 1}
          </span>
        </motion.button>
      ))}
      {loading && thumbnails.length < pageCount ? (
        <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-border text-[10px] text-muted-foreground">
          Loading…
        </div>
      ) : null}
    </div>
  );
}

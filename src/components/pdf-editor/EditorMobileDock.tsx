"use client";

import { ChevronLeft, ChevronRight, Download, Maximize2, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  pageCount: number;
  zoomFactor: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  undoDisabled: boolean;
  redoDisabled: boolean;
  saveDisabled: boolean;
  saving?: boolean;
  saveProgress?: number;
  className?: string;
};

export function EditorMobileDock({
  currentPage,
  pageCount,
  zoomFactor,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onUndo,
  onRedo,
  onSave,
  undoDisabled,
  redoDisabled,
  saveDisabled,
  saving,
  saveProgress,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "surface-glass fixed inset-x-0 bottom-0 z-[46] flex flex-col gap-2 border-t border-border/60 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80 disabled:opacity-40"
            aria-label={t("pdfEditor.prevPage", { defaultValue: "Previous page" })}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4rem] text-center text-xs font-semibold tabular-nums">
            {t("pdfEditor.pageNofM", { current: currentPage, total: pageCount || "…" })}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= pageCount}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80 disabled:opacity-40"
            aria-label={t("pdfEditor.nextPage", { defaultValue: "Next page" })}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1" aria-label={t("pdfEditor.zoomLabel")}>
          <button type="button" onClick={onZoomOut} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
            {t("pdfEditor.zoomPercent", { pct: Math.round(zoomFactor * 100) })}
          </span>
          <button type="button" onClick={onZoomIn} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" onClick={onFitWidth} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={undoDisabled}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80 disabled:opacity-40"
            title={t("pdfEditor.undo")}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={redoDisabled}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/80 disabled:opacity-40"
            title={t("pdfEditor.redo")}
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {saveProgress ?? 0}%
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {t("pdfEditor.savePdf")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}


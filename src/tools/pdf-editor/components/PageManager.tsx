import { useState } from "react";
import { RotateCw, Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  pageOrder: number[];
  onPageReorder: (order: number[]) => void;
  onRotatePage: (pageIndex: number, degrees: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onInsertPage: (index: number) => void;
}

export function PageManager({
  pageOrder,
  onPageReorder,
  onRotatePage,
  onDeletePage,
  onInsertPage,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...pageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onPageReorder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === pageOrder.length - 1) return;
    const newOrder = [...pageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onPageReorder(newOrder);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        <RotateCw className="w-3.5 h-3.5" /> Pages
      </button>
    );
  }

  return (
    <div className="absolute top-14 left-0 z-40 bg-card border border-border rounded-xl p-4 shadow-xl w-64 max-h-[400px] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Page Manager</span>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>

      <div className="space-y-1">
        {pageOrder.map((pageIdx, currentIdx) => (
          <div
            key={`${pageIdx}-${currentIdx}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted"
          >
            <span className="text-xs font-medium text-foreground w-6">
              {currentIdx + 1}
            </span>
            <span className="text-xs text-muted-foreground flex-1">
              Page {pageIdx + 1}
            </span>
            <button
              onClick={() => moveUp(currentIdx)}
              disabled={currentIdx === 0}
              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveDown(currentIdx)}
              disabled={currentIdx === pageOrder.length - 1}
              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRotatePage(pageIdx, 90)}
              className="p-0.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeletePage(pageIdx)}
              className="p-0.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => onInsertPage(pageOrder.length)}
        className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Insert Page
      </button>
    </div>
  );
}

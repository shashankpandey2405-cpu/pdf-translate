"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type SortableThumbProps = {
  id: string;
  thumb: string;
  label: string;
};

function SortableThumb({ id, thumb, label }: SortableThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-xl border-2 border-border bg-card touch-manipulation",
        isDragging && "z-10 border-primary shadow-lg opacity-90",
      )}
    >
      <button
        type="button"
        className="absolute left-1 top-1 z-10 cursor-grab rounded bg-background/90 p-1 text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`Drag page ${label}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <img src={thumb} alt={`Page ${label}`} className="w-full object-contain" draggable={false} />
      <span className="w-full bg-muted/80 py-1 text-center text-xs font-semibold text-foreground">{label}</span>
    </div>
  );
}

type Props = {
  thumbnails: string[];
  pageOrder: number[];
  onReorder: (order: number[]) => void;
  loading?: boolean;
};

export function OrganizePageSortableGrid({ thumbnails, pageOrder, onReorder, loading }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pageOrder.indexOf(Number(active.id));
    const newIndex = pageOrder.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(pageOrder, oldIndex, newIndex));
  };

  if (loading && pageOrder.length === 0) {
    return (
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={pageOrder.map(String)} strategy={rectSortingStrategy}>
        <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {pageOrder.map((origIdx, pos) => (
            <SortableThumb
              key={origIdx}
              id={String(origIdx)}
              thumb={thumbnails[origIdx] ?? ""}
              label={`${pos + 1} ← was ${origIdx + 1}`}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

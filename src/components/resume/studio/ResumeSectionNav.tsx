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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RESUME_SECTIONS, sectionCompletion } from "@/tools/resume/sections";
import { isSectionVisible, type ResumeData, type ResumeSectionId } from "@/tools/resume/types";

type Props = {
  data: ResumeData;
  activeSection: ResumeSectionId;
  onActive: (id: ResumeSectionId) => void;
  onPatch: (fn: (d: ResumeData) => ResumeData) => void;
};

function SortableItem({
  id,
  label,
  status,
  active,
  visible,
  onSelect,
  onToggle,
}: {
  id: ResumeSectionId;
  label: string;
  status: "empty" | "partial" | "done";
  active: boolean;
  visible: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const dot =
    status === "done" ? "bg-emerald-500" : status === "partial" ? "bg-amber-400" : "bg-slate-300";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-xl border px-2 py-2 text-sm ${
        active ? "border-primary bg-primary/5" : "border-border bg-card"
      } ${!visible ? "opacity-50" : ""}`}
    >
      <button type="button" className="touch-manipulation p-1 text-muted-foreground cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onSelect} className="flex-1 text-left font-medium truncate">
        <span className={`inline-block h-2 w-2 rounded-full mr-2 ${dot}`} />
        {label}
      </button>
      <button type="button" onClick={onToggle} className="p-1 text-muted-foreground" aria-label={visible ? "Hide section" : "Show section"}>
        {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ResumeSectionNav({ data, activeSection, onActive, onPatch }: Props) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onPatch((d) => {
      const oldIndex = d.sectionOrder.indexOf(active.id as ResumeSectionId);
      const newIndex = d.sectionOrder.indexOf(over.id as ResumeSectionId);
      return { ...d, sectionOrder: arrayMove(d.sectionOrder, oldIndex, newIndex) };
    });
  };

  const toggleVisibility = (id: ResumeSectionId) => {
    onPatch((d) => ({
      ...d,
      sectionVisibility: {
        ...d.sectionVisibility,
        [id]: !isSectionVisible(d, id),
      },
    }));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={data.sectionOrder} strategy={verticalListSortingStrategy}>
        <nav className="space-y-1.5">
          {data.sectionOrder.map((id) => {
            const meta = RESUME_SECTIONS.find((s) => s.id === id);
            if (!meta) return null;
            return (
              <SortableItem
                key={id}
                id={id}
                label={t(meta.labelKey)}
                status={sectionCompletion(data, id)}
                active={activeSection === id}
                visible={isSectionVisible(data, id)}
                onSelect={() => onActive(id)}
                onToggle={() => toggleVisibility(id)}
              />
            );
          })}
        </nav>
      </SortableContext>
    </DndContext>
  );
}

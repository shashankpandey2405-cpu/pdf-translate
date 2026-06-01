"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Annotation } from "@/tools/pdf-editor/logic";

type Props = {
  annotation: Annotation;
  onPatch: (patch: Record<string, number | string | boolean>) => void;
};

function numField(
  label: string,
  value: number,
  onChange: (n: number) => void,
  step = 1,
) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={Math.round(value * 10) / 10}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="h-8 text-xs"
      />
    </div>
  );
}

/** Inspector-style geometry & style controls for the selected canvas object. */
export function EditorSelectionProperties({ annotation, onPatch }: Props) {
  const hasBox =
    annotation.type === "text" ||
    annotation.type === "rect" ||
    annotation.type === "circle" ||
    annotation.type === "highlight" ||
    annotation.type === "whiteout" ||
    annotation.type === "image";

  if (!hasBox && annotation.type !== "line") {
    return (
      <p className="text-[11px] text-muted-foreground">
        Select a text, shape, image, or stamp layer to edit position and size.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selection</p>
      <p className="text-[10px] capitalize text-muted-foreground">{annotation.type}</p>

      {annotation.type === "text" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {numField("Left", annotation.x, (x) => onPatch({ x }))}
            {numField("Top", annotation.y, (y) => onPatch({ y }))}
          </div>
          {numField("Font size", annotation.size, (size) => onPatch({ size }), 1)}
        </>
      )}

      {(annotation.type === "rect" ||
        annotation.type === "circle" ||
        annotation.type === "highlight" ||
        annotation.type === "whiteout" ||
        annotation.type === "image") && (
        <div className="grid grid-cols-2 gap-2">
          {numField("Left", annotation.x, (x) => onPatch({ x }))}
          {numField("Top", annotation.y, (y) => onPatch({ y }))}
          {numField("Width", annotation.w, (w) => onPatch({ w: Math.max(4, w) }))}
          {numField("Height", annotation.h, (h) => onPatch({ h: Math.max(4, h) }))}
        </div>
      )}

      {annotation.type === "line" && (
        <div className="grid grid-cols-2 gap-2">
          {numField("X1", annotation.x1, (x1) => onPatch({ x1 }))}
          {numField("Y1", annotation.y1, (y1) => onPatch({ y1 }))}
          {numField("X2", annotation.x2, (x2) => onPatch({ x2 }))}
          {numField("Y2", annotation.y2, (y2) => onPatch({ y2 }))}
        </div>
      )}

      {annotation.type === "highlight" && (
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Opacity</Label>
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round((annotation.opacity ?? 0.35) * 100)}
            onChange={(e) => onPatch({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-primary"
          />
        </div>
      )}

      {(annotation.type === "rect" || annotation.type === "circle") && (
        numField("Stroke", annotation.lineWidth, (lineWidth) => onPatch({ lineWidth: Math.max(1, lineWidth) }), 0.5)
      )}
    </div>
  );
}

"use client";

import { CheckCircle } from "lucide-react";
import type { WatermarkOptions } from "@/tools/watermark-pdf/logic";

export type WatermarkColor = WatermarkOptions["color"];

const COLORS: { value: WatermarkColor; label: string; preview: string }[] = [
  { value: "gray", label: "Gray", preview: "bg-gray-400" },
  { value: "red", label: "Red", preview: "bg-red-500" },
  { value: "blue", label: "Blue", preview: "bg-blue-500" },
  { value: "black", label: "Black", preview: "bg-gray-900" },
];

type Props = {
  text: string;
  onTextChange: (text: string) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  fontSize: number;
  onFontSizeChange: (fontSize: number) => void;
  color: WatermarkColor;
  onColorChange: (color: WatermarkColor) => void;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  position: WatermarkOptions["position"];
  onPositionChange: (position: WatermarkOptions["position"], anchorX: number, anchorY: number) => void;
  compact?: boolean;
};

export function WatermarkOptionsForm({
  text,
  onTextChange,
  opacity,
  onOpacityChange,
  fontSize,
  onFontSizeChange,
  color,
  onColorChange,
  rotation,
  onRotationChange,
  zoom,
  onZoomChange,
  position,
  onPositionChange,
  compact = false,
}: Props) {
  const labelClass = compact ? "mb-1.5 block text-xs font-medium text-foreground" : "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Watermark text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="e.g. CONFIDENTIAL, DRAFT"
          data-testid="input-watermark-text"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className={labelClass}>Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              data-testid={`button-color-${c.value}`}
              onClick={() => onColorChange(c.value)}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs transition-all ${
                color === c.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span className={`h-3 w-3 rounded-full ${c.preview}`} />
              {c.label}
              {color === c.value && !compact ? <CheckCircle className="h-3 w-3 text-primary" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Opacity ({Math.round(opacity * 100)}%)</label>
        <input
          type="range"
          min="0.1"
          max="0.8"
          step="0.05"
          value={opacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          data-testid="input-opacity"
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className={labelClass}>Font size ({fontSize}pt)</label>
        <input
          type="range"
          min="20"
          max="80"
          step="4"
          value={fontSize}
          onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
          data-testid="input-font-size"
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className={labelClass}>Rotation ({rotation}°)</label>
        <input
          type="range"
          min="0"
          max="360"
          step="15"
          value={rotation}
          onChange={(e) => onRotationChange(parseInt(e.target.value, 10))}
          data-testid="input-rotation"
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className={labelClass}>Zoom ({zoom.toFixed(1)}x)</label>
        <input
          type="range"
          min="0.8"
          max="2"
          step="0.1"
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className={labelClass}>Position</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "top-left", label: "Top Left" },
            { value: "top", label: "Top" },
            { value: "top-right", label: "Top Right" },
            { value: "center", label: "Center" },
            { value: "bottom-left", label: "Bottom Left" },
            { value: "bottom", label: "Bottom" },
            { value: "bottom-right", label: "Bottom Right" },
          ].map((pos) => (
            <button
              key={pos.value}
              type="button"
              onClick={() => {
                const next = pos.value as WatermarkOptions["position"];
                let ax = 0.5;
                let ay = 0.5;
                if (next === "center") {
                  ax = 0.5;
                  ay = 0.5;
                } else if (next === "top") {
                  ax = 0.5;
                  ay = 0.87;
                } else if (next === "bottom") {
                  ax = 0.5;
                  ay = 0.13;
                } else if (next === "top-left") {
                  ax = 0.16;
                  ay = 0.87;
                } else if (next === "top-right") {
                  ax = 0.84;
                  ay = 0.87;
                } else if (next === "bottom-left") {
                  ax = 0.16;
                  ay = 0.13;
                } else if (next === "bottom-right") {
                  ax = 0.84;
                  ay = 0.13;
                }
                onPositionChange(next, ax, ay);
              }}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                position === pos.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

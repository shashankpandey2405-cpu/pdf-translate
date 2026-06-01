"use client";

import type { TranslateLayoutMode } from "@/lib/processing/aiCloudOptions";
import { cn } from "@/lib/utils";

type Props = {
  value: TranslateLayoutMode;
  onChange: (mode: TranslateLayoutMode) => void;
  disabled?: boolean;
};

export function TranslateLayoutPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Output layout</p>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("keep_layout")}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
            value === "keep_layout"
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted/50",
          )}
        >
          <span className="font-semibold text-foreground">Keep layout</span>
          <span className="mt-0.5 block text-[11px] leading-relaxed">
            Keeps your original PDF (photo, colors, layout). Translated text is placed on the same pages — best for IDs, forms, and scans.
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("text_only")}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
            value === "text_only"
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted/50",
          )}
        >
          <span className="font-semibold text-foreground">Text only</span>
          <span className="mt-0.5 block text-[11px] leading-relaxed">
            Simple text document — easier to copy; photos and original design are not kept.
          </span>
        </button>
      </div>
    </div>
  );
}

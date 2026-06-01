"use client";

import { Hash, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { addPageNumbers, getNumberedFilename, type PageNumberOptions } from "@/tools/page-numbers/logic";
import { content } from "@/tools/page-numbers/content";
import { ToolModalSettingsBlock } from "@/components/tools/ToolModalSettingsBlock";

type Position = PageNumberOptions["position"];

const POSITIONS: { value: Position; label: string }[] = [
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "top-center", label: "Top Center" },
];

export default function PageNumbers() {
  const { i18n } = useTranslation();
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [fontSize, setFontSize] = useState(11);

  const preview = `${prefix}${startAt}${suffix}`;

  const optionsPanel = (
    <ToolModalSettingsBlock title="Page number options">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">Position</label>
          <div className="grid grid-cols-2 gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPosition(p.value)}
                className={`rounded-xl border-2 p-2.5 text-xs font-semibold transition-all ${
                  position === p.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {p.label}
                {position === p.value ? <CheckCircle className="mx-auto mt-1 h-3 w-3 text-primary" /> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Page "
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Start at</label>
            <input
              type="number"
              min={1}
              value={startAt}
              onChange={(e) => setStartAt(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Suffix</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder=" of 10"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Font size — <span className="text-primary">{fontSize}pt</span>
          </label>
          <input
            type="range"
            min={8}
            max={20}
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <span className="font-mono text-sm font-semibold" style={{ fontSize: `${Math.max(fontSize, 10)}px` }}>
            {preview}
          </span>
        </div>
      </div>
    </ToolModalSettingsBlock>
  );

  return (
    <SinglePdfToolShell
      slug={content.slug}
      toolLabel="Add Page Numbers"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<Hash className="h-5 w-5 text-teal-600" />}
      iconClassName="bg-teal-50"
      steps={content.steps}
      lang={i18n.language}
      configurePanel={() => optionsPanel}
      onProcess={async (file) => {
        const result = await addPageNumbers(file, {
          position,
          startAt,
          prefix,
          suffix,
          fontSize,
          margin: 24,
        });
        return {
          blob: new Blob([result as BlobPart], { type: "application/pdf" }),
          filename: getNumberedFilename(file),
        };
      }}
    />
  );
}

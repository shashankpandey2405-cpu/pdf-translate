"use client";

import { useTranslation } from "react-i18next";
import type { ResumeAccentColor, ResumeData, ResumeFontFamily } from "@/tools/resume/types";

type Props = {
  data: ResumeData;
  zoom: number;
  onZoom: (z: number) => void;
  onPatch: (fn: (d: ResumeData) => ResumeData) => void;
};

const ACCENTS: ResumeAccentColor[] = ["slate", "navy", "emerald", "burgundy"];
const FONTS: ResumeFontFamily[] = ["inter", "georgia", "system-serif"];

export function ResumeDesignBar({ data, zoom, onZoom, onPatch }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("resumeStudio.design.title")}</p>
      <div>
        <label className="text-xs font-medium">{t("resumeStudio.design.accent")}</label>
        <div className="mt-1.5 flex gap-2 flex-wrap">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => onPatch((d) => ({ ...d, design: { ...d.design, accentColor: c } }))}
              className={`h-7 w-7 rounded-full border-2 ${
                data.design.accentColor === c ? "border-primary ring-2 ring-primary/30" : "border-transparent"
              } ${
                c === "slate"
                  ? "bg-slate-800"
                  : c === "navy"
                    ? "bg-slate-950"
                    : c === "emerald"
                      ? "bg-emerald-800"
                      : "bg-rose-900"
              }`}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium">{t("resumeStudio.design.font")}</label>
        <select
          value={data.design.fontFamily}
          onChange={(e) =>
            onPatch((d) => ({ ...d, design: { ...d.design, fontFamily: e.target.value as ResumeFontFamily } }))
          }
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {t(`resumeStudio.design.fonts.${f}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium">{t("resumeStudio.design.zoom")} {Math.round(zoom * 100)}%</label>
        <input
          type="range"
          min={0.5}
          max={1.25}
          step={0.05}
          value={zoom}
          onChange={(e) => onZoom(Number(e.target.value))}
          className="mt-1.5 w-full"
        />
      </div>
    </div>
  );
}

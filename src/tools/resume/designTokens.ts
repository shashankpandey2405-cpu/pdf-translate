import type { ResumeAccentColor, ResumeFontFamily } from "./types";

export const ACCENT_CLASSES: Record<
  ResumeAccentColor,
  { sidebar: string; border: string; text: string; tag: string }
> = {
  slate: {
    sidebar: "bg-slate-900",
    border: "border-slate-800",
    text: "text-slate-900",
    tag: "bg-slate-100",
  },
  navy: {
    sidebar: "bg-slate-950",
    border: "border-blue-900",
    text: "text-blue-950",
    tag: "bg-blue-50",
  },
  emerald: {
    sidebar: "bg-emerald-900",
    border: "border-emerald-800",
    text: "text-emerald-950",
    tag: "bg-emerald-50",
  },
  burgundy: {
    sidebar: "bg-rose-950",
    border: "border-rose-900",
    text: "text-rose-950",
    tag: "bg-rose-50",
  },
};

export const FONT_CLASSES: Record<ResumeFontFamily, string> = {
  inter: "font-sans",
  georgia: "font-serif",
  "system-serif": "font-serif",
};

export const FONT_STYLE: Record<ResumeFontFamily, string | undefined> = {
  inter: undefined,
  georgia: "Georgia, 'Times New Roman', serif",
  "system-serif": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
};

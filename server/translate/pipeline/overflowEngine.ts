import type { TranslatedPdfRun } from "@/server/ai/translatePdfRuns";

const MIN_FONT_PT = 7;

/** Shrink font size so translated text fits the original box width (Latin estimate). */
export function fitFontSizeToBox(run: TranslatedPdfRun): number {
  const text = run.translated.trim() || run.text;
  const base = run.fontSize;
  if (!text || run.width <= 0) return base;

  const avgChar = base * 0.48;
  const estimated = (text.length * avgChar) / Math.max(run.width, 1);
  if (estimated <= 1) return base;
  return Math.max(MIN_FONT_PT, base / Math.sqrt(estimated));
}

export function applyOverflowFitting(runs: TranslatedPdfRun[]): TranslatedPdfRun[] {
  return runs.map((r) => ({
    ...r,
    fontSize: fitFontSizeToBox(r),
  }));
}

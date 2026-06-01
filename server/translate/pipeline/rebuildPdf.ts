import { applyClassicLayoutTranslation } from "@/server/translate/pipeline/classicApplyLayout";
import { buildTextPdfExportUnicode } from "@/server/pdf/buildTextPdfUnicode";
import type { TranslatedPdfRun } from "@/server/ai/translatePdfRuns";

export async function rebuildTranslatedPdf(
  sourceBytes: Uint8Array,
  runs: TranslatedPdfRun[],
  opts: {
    maxPages: number;
    targetLangCode: string;
    forceTextOnly?: boolean;
  },
): Promise<Uint8Array> {
  if (opts.forceTextOnly || runs.length < 4) {
    const byPage = new Map<number, string[]>();
    for (const r of runs) {
      const list = byPage.get(r.pageIndex) ?? [];
      list.push(r.translated.trim() || r.text);
      byPage.set(r.pageIndex, list);
    }
    const pageTexts = [...byPage.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, lines]) => lines.join(" "));
    return buildTextPdfExportUnicode({
      pageTexts,
      sourcePdfBytes: sourceBytes,
      title: "PDF Translation — PDFTrusted Classic",
    });
  }

  return applyClassicLayoutTranslation(sourceBytes, runs, {
    maxPages: opts.maxPages,
    targetLangCode: opts.targetLangCode,
  });
}

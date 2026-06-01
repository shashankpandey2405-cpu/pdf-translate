import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import type { TranslatedPdfRun } from "@/server/ai/translatePdfRuns";
import { textNeedsUnicodeFont } from "@/lib/pdf/textPdfUnicode";
import { buildTextPdfExportUnicode } from "@/server/pdf/buildTextPdfUnicode";

export function layoutNeedsCanvasOverlay(runs: TranslatedPdfRun[]): boolean {
  const combined = runs.map((r) => r.translated).join("");
  return textNeedsUnicodeFont(combined);
}

export async function applyCanvasLayoutTranslation(
  sourceBytes: Uint8Array,
  runs: TranslatedPdfRun[],
  maxPages: number,
): Promise<Uint8Array> {
  const byPage = new Map<number, string[]>();
  for (const run of runs) {
    if (run.pageIndex >= maxPages) continue;
    const list = byPage.get(run.pageIndex) ?? [];
    list.push(run.translated.trim() || run.text);
    byPage.set(run.pageIndex, list);
  }
  const pageTexts = [...byPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, lines]) => lines.join(" "));

  if (pageTexts.length === 0) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Translation produced no visible text.", {
      x: 48,
      y: 794,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    stampTrustShieldMetadata(doc);
    return doc.save();
  }

  return buildTextPdfExportUnicode({
    pageTexts,
    sourcePdfBytes: sourceBytes,
    title: "PDF Translation — PDFTrusted Classic",
  });
}

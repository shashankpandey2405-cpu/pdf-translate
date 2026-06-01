import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { embedUnicodeCapableFont } from "@/server/pdf/unicodePdfFont";
import { layoutNeedsCanvasOverlay, applyCanvasLayoutTranslation } from "@/server/pdf/canvasLayoutTranslate";
import { textNeedsUnicodeFont } from "@/lib/pdf/textPdfUnicode";
import type { TranslatedPdfRun } from "@/server/ai/translatePdfRuns";
import { loadPdfForEditing } from "@/server/pdf/loadPdfForEditing";
import { normalizePdfBytes } from "@/server/pdf/pdfBytes";
import { isRtlLang } from "@/server/translate/fontMap";
import { prepareRtlDisplayText, rtlDrawX } from "@/server/translate/rtl";

/** Layout-preserving overlay for Classic MT (all scripts, not only Latin). */
export async function applyClassicLayoutTranslation(
  sourceBytes: Uint8Array,
  translatedRuns: TranslatedPdfRun[],
  opts: { maxPages: number; targetLangCode: string },
): Promise<Uint8Array> {
  const normalized = normalizePdfBytes(sourceBytes);

  if (layoutNeedsCanvasOverlay(translatedRuns)) {
    return applyCanvasLayoutTranslation(normalized, translatedRuns, opts.maxPages);
  }

  const loaded = await loadPdfForEditing(normalized, opts.maxPages);
  if (loaded.mode === "raster") {
    return applyCanvasLayoutTranslation(normalized, translatedRuns, opts.maxPages);
  }

  const pdfDoc = loaded.doc;
  const combined = translatedRuns.map((r) => r.translated).join("");
  const unicodeFont = textNeedsUnicodeFont(combined) ? await embedUnicodeCapableFont(pdfDoc) : null;
  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const font = unicodeFont ?? latinFont;
  const pages = pdfDoc.getPages();
  const rtl = isRtlLang(opts.targetLangCode);

  for (const run of translatedRuns) {
    const page = pages[run.pageIndex];
    if (!page) continue;
    let text = run.translated.trim() || run.text;
    if (!text.trim()) continue;
    if (rtl) text = prepareRtlDisplayText(text, opts.targetLangCode);

    page.drawRectangle({
      x: run.x - 1,
      y: run.y - 1,
      width: run.width + 2,
      height: run.height + 2,
      color: rgb(1, 1, 1),
      opacity: 1,
    });

    const fontSize = Math.min(run.fontSize, run.height * 0.95);
    const drawX = rtl
      ? rtlDrawX(run.x, run.width, text.length * fontSize * 0.45, opts.targetLangCode)
      : run.x;

    try {
      page.drawText(text, {
        x: drawX,
        y: run.y + run.height * 0.12,
        size: fontSize,
        font,
        color: rgb(0.08, 0.08, 0.1),
        maxWidth: run.width,
      });
    } catch {
      /* skip unrenderable glyph */
    }
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

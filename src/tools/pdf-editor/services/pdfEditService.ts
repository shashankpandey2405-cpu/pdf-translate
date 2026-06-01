import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import type { CanvasDim, TextItemPosition } from "../types";

/**
 * Edit existing text in a PDF by overlaying replacement text.
 * Strategy: draw white rectangle over original text, then add new text.
 */
export async function editTextInPDF(
  file: File,
  page: number,
  originalItems: TextItemPosition[],
  edits: { index: number; newText: string }[],
  dims: Record<number, CanvasDim>
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pdfPage = pdfDoc.getPages()[page];
  const dim = dims[page];

  if (!pdfPage || !dim) return new Uint8Array();

  const sx = dim.pdfWidth / dim.width;
  const sy = dim.pdfHeight / dim.height;

  for (const edit of edits) {
    const item = originalItems[edit.index];
    if (!item) continue;

    // Calculate text position in PDF coordinates
    const x = item.transform[4] * sx;
    const y = dim.pdfHeight - item.transform[5] * sy;
    const textWidth = item.width * sx;
    const textHeight = item.height * sy;

    // Draw white rectangle over original text
    pdfPage.drawRectangle({
      x: x - 2,
      y: y - 2,
      width: textWidth + 4,
      height: textHeight + 4,
      color: rgb(1, 1, 1),
      opacity: 1,
    });

    // Draw replacement text
    pdfPage.drawText(edit.newText, {
      x,
      y: y - textHeight * 0.2,
      size: item.height * sy,
      font,
      color: rgb(0, 0, 0),
    });
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

/**
 * Get all text content from a PDF page as a single string.
 */
export async function getPageText(
  file: File,
  pageNumber: number
): Promise<string> {
  void pageNumber;
  void file;
  // This is a placeholder - actual implementation would use pdfjs-dist
  // to extract text content
  return "";
}

import { PDFDocument, rgb } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import type { CanvasDim } from "../logic";
import { matchPdfFontName } from "./fontMatch";
import type { ContentTextPick } from "./extractTextRuns";

export type TextRunEdit = ContentTextPick & { replace: string };

/**
 * Replace text in-place on a PDF page: whiteout region + draw replacement with matched Standard Font.
 */
export async function editTextRunInPdf(
  file: File,
  pageIndex: number,
  edit: TextRunEdit,
  dims: Record<number, CanvasDim>,
): Promise<Uint8Array> {
  const dim = dims[pageIndex];
  if (!dim) throw new Error("Page dimensions not ready. Wait for the page to finish loading.");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const page = pdfDoc.getPages()[pageIndex];
  if (!page) throw new Error("Page not found");

  const fontKey = matchPdfFontName(edit.fontName);
  const font = await pdfDoc.embedFont(fontKey);

  const sx = dim.pdfWidth / dim.width;
  const sy = dim.pdfHeight / dim.height;
  const flipY = (cy: number) => dim.pdfHeight - cy * sy;

  const x = edit.vx * sx;
  const rawY = edit.vy;
  const w = Math.abs(edit.vw) * sx;
  const h = Math.abs(edit.vh) * sy;
  const fontSize = (edit.fontSizePx ?? edit.vh * 0.85) * sy;

  page.drawRectangle({
    x: x - 1,
    y: flipY(rawY + edit.vh) - 1,
    width: w + 2,
    height: h + 2,
    color: rgb(1, 1, 1),
    opacity: 1,
  });

  const newText = edit.replace.trim() || " ";
  page.drawText(newText, {
    x: x + 1,
    y: flipY(rawY + edit.vh * 0.88) - fontSize * 0.2,
    size: fontSize,
    font,
    color: rgb(0.1, 0.1, 0.12),
  });

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

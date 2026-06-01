import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { ConversionError } from "@/tools/conversions/ConversionError";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { loadXlsx } from "@/lib/lazy/xlsx";

const MAX_SHEET_ROWS = 3000;

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;
const FONT_SIZE = 9;
const LINE_FACTOR = 1.25;
const MIN_COL_PT = 36;
const MAX_COL_PT = 200;

function ellipsisText(font: PDFFont, text: string, size: number, maxW: number): string {
  const t = String(text ?? "").replace(/\r/g, "").replace(/\n/g, " ");
  if (!t) return "";
  if (font.widthOfTextAtSize(t, size) <= maxW) return t;
  let s = t;
  const ell = "…";
  while (s.length > 0 && font.widthOfTextAtSize(s + ell, size) > maxW) {
    s = s.slice(0, -1);
  }
  return s ? s + ell : ell;
}

/** Scale column widths so they fit usable width on A4 */
function computeColumnWidths(
  font: PDFFont,
  rows: string[][],
  colCount: number,
  usableWidth: number,
): number[] {
  const lengths = Array.from({ length: colCount }, (_, j) =>
    Math.max(...rows.map((r) => (r[j] ?? "").length), 4),
  );
  const raw = lengths.map((len) =>
    Math.min(Math.max(font.widthOfTextAtSize("M".repeat(Math.min(len, 80)), FONT_SIZE), MIN_COL_PT), MAX_COL_PT),
  );
  const sum = raw.reduce((a, b) => a + b, 0);
  const scale = sum > usableWidth ? usableWidth / sum : 1;
  return raw.map((w) => Math.max(MIN_COL_PT * scale, w * scale));
}

export async function excelFileToPdf(file: File): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
  const XLSX = await loadXlsx();
  let workbook: import("xlsx").WorkBook;
  try {
    const buf = await file.arrayBuffer();
    workbook = XLSX.read(buf, { type: "array", cellDates: true });
  } catch {
    throw new ConversionError(
      "STRUCTURE",
      "File structure too complex — we could not read this spreadsheet. Try saving as .xlsx from Excel.",
    );
  }

  if (!workbook.SheetNames?.length) {
    throw new ConversionError("EMPTY", "No worksheets found in this file.");
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const usableW = A4_W - 2 * MARGIN;
  const rowHeight = FONT_SIZE * LINE_FACTOR + 6;
  const headerPad = 22;

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    let rows: string[][];
    try {
      rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false }) as string[][];
    } catch {
      throw new ConversionError("STRUCTURE", "File structure too complex — this sheet could not be interpreted.");
    }

    const trimmed = rows
      .slice(0, MAX_SHEET_ROWS)
      .map((r) => (r ?? []).map((c) => String(c ?? "").slice(0, 600)))
      .filter((r) => r.some((c) => String(c).trim().length > 0));

    if (!trimmed.length) {
      const page = pdfDoc.addPage([A4_W, A4_H]);
      page.drawText(`(${sheetName || "Sheet"} — empty)`, {
        x: MARGIN,
        y: A4_H - MARGIN - 24,
        size: 11,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
      continue;
    }

    const colCount = Math.max(...trimmed.map((r) => r.length), 1);
    const normalized = trimmed.map((r) => {
      const row = [...r];
      while (row.length < colCount) row.push("");
      return row;
    });

    const colWidths = computeColumnWidths(font, normalized, colCount, usableW);

    let page = pdfDoc.addPage([A4_W, A4_H]);
    let cursorY = A4_H - MARGIN;

    const title = sheetName.slice(0, 120);
    page.drawText(title, {
      x: MARGIN,
      y: cursorY - 14,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.2),
    });
    cursorY -= headerPad;

    for (let ri = 0; ri < normalized.length; ri++) {
      if (cursorY - rowHeight < MARGIN + 20) {
        page = pdfDoc.addPage([A4_W, A4_H]);
        cursorY = A4_H - MARGIN;
      }

      const row = normalized[ri]!;
      let x = MARGIN;
      for (let ci = 0; ci < colCount; ci++) {
        const cw = colWidths[ci]!;
        const rawCell = row[ci] ?? "";
        const display = ellipsisText(font, rawCell, FONT_SIZE, cw - 6);

        page.drawRectangle({
          x,
          y: cursorY - rowHeight,
          width: cw,
          height: rowHeight,
          borderColor: rgb(0.78, 0.78, 0.82),
          borderWidth: 0.45,
          color: rgb(1, 1, 1),
        });

        page.drawText(display, {
          x: x + 3,
          y: cursorY - rowHeight + 5,
          size: FONT_SIZE,
          font,
          color: rgb(0.08, 0.08, 0.1),
          maxWidth: cw - 6,
        });
        x += cw;
      }
      cursorY -= rowHeight;
    }
  }

  pdfDoc.setTitle(file.name.replace(/\.[^.]+$/i, ""));
  stampTrustShieldMetadata(pdfDoc);
  try {
    return await pdfDoc.save();
  } catch {
    throw new ConversionError("UNKNOWN", "Could not build the PDF output.");
  }
  });
}

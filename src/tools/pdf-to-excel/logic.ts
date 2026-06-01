/**
 * PDF → spreadsheet reconstruction uses pdf.js text positioning (browser-safe).
 * `pdf-parse` targets Node; pdf.js exposes richer geometry for column/layout guessing here.
 */
import {
  assertWithinBrowserPageCap,
  getPageProcessingChunkSize,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { ConversionError } from "@/tools/conversions/ConversionError";
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import { loadXlsx } from "@/lib/lazy/xlsx";

const MAX_ROWS_PER_SHEET = 2500;

const FONT_SIZE_EST = 5;

interface LayoutItem {
  vx: number;
  vy: number;
  str: string;
  /** Approximate right edge in viewport space */
  right: number;
}

const ROW_TOL = 8;
const COL_GAP = 12;

function clusterRows(items: LayoutItem[]): LayoutItem[][] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.vy - b.vy || a.vx - b.vx);
  const rows: LayoutItem[][] = [];
  let bucket: LayoutItem[] = [];
  let anchorY = sorted[0]!.vy;

  for (const it of sorted) {
    if (!bucket.length || Math.abs(it.vy - anchorY) <= ROW_TOL) {
      bucket.push(it);
      anchorY = bucket.length === 1 ? it.vy : anchorY * 0.6 + it.vy * 0.4;
    } else {
      rows.push(bucket);
      bucket = [it];
      anchorY = it.vy;
    }
  }
  if (bucket.length) rows.push(bucket);
  return rows;
}

/** Merge adjacent fragments on the same visual row into tabular columns */
function rowToCells(row: LayoutItem[]): string[] {
  const sorted = [...row].sort((a, b) => a.vx - b.vx);
  const cells: string[] = [];
  let buf = "";
  let prevRight = -Infinity;

  for (const it of sorted) {
    if (prevRight >= 0 && it.vx - prevRight > COL_GAP) {
      if (buf.trim()) cells.push(buf.trim());
      buf = it.str;
    } else {
      buf = buf ? `${buf} ${it.str}` : it.str;
    }
    prevRight = Math.max(prevRight, it.right);
  }
  if (buf.trim()) cells.push(buf.trim());
  return cells;
}

/**
 * Extract tabular-ish text using pdf.js positioning (browser-safe).
 * Table reconstruction is heuristic; scanned PDFs may yield poor results.
 */
export async function pdfFileToExcel(file: File): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
  let pdf;
  try {
    pdf = await acquirePdfDocument(file);
  } catch {
    throw new ConversionError(
      "STRUCTURE",
      "File structure too complex — this PDF could not be opened. It may be corrupted or password-protected.",
    );
  }

  const pdfjsLib = await import("pdfjs-dist");

  try {
    assertWithinBrowserPageCap(pdf.numPages);
    const allLines: string[][] = [];
    let charCount = 0;
    const chunk = getPageProcessingChunkSize();

    for (let p = 1; p <= pdf.numPages; p++) {
      let page;
      try {
        page = await pdf.getPage(p);
      } catch {
        continue;
      }
      const viewport = page.getViewport({ scale: 1 });
      let textContent;
      try {
        textContent = await page.getTextContent();
      } catch {
        continue;
      }

      const layout: LayoutItem[] = [];
      for (const raw of textContent.items) {
        if (!("str" in raw)) continue;
        const item = raw as { str: string; transform: number[]; width?: number };
        const s = item.str?.trim();
        if (!s) continue;
        try {
          const m = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const vx = m[4];
          const vy = m[5];
          const w = item.width || s.length * FONT_SIZE_EST;
          layout.push({ vx, vy, str: s, right: vx + w });
          charCount += s.length;
        } catch {
          layout.push({ vx: 0, vy: 0, str: s, right: s.length * FONT_SIZE_EST });
          charCount += s.length;
        }
      }

      if (layout.length) {
        allLines.push([`--- Page ${p} ---`]);
        const rows = clusterRows(layout);
        for (const r of rows) {
          allLines.push(rowToCells(r));
        }
        allLines.push([]);
      }
      if (page) {
        try {
          page.cleanup();
        } catch {
          /* ignore */
        }
      }
      if (p % chunk === 0) await yieldToMain();
    }

    const avgChars = charCount / Math.max(pdf.numPages, 1);
    if (avgChars < 80) {
      throw new ConversionError(
        "UNSUPPORTED",
        "This PDF appears scanned or image-based. Use Cloud Processing for table extraction with OCR, or run OCR PDF first.",
      );
    }

    if (!allLines.length) {
      throw new ConversionError(
        "EMPTY",
        "No extractable text found — scanned PDFs need OCR first (use OCR PDF in cloud mode).",
      );
    }

    const capped = allLines.slice(0, MAX_ROWS_PER_SHEET);
    const maxCols = Math.max(...capped.map((r) => r.length), 1);
    const padded = capped.map((r) => {
      const row = [...r];
      while (row.length < maxCols) row.push("");
      return row;
    });

    try {
      const XLSX = await loadXlsx();
      const ws = XLSX.utils.aoa_to_sheet(padded);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Extracted");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array", compression: true }) as Uint8Array;
      return out;
    } catch {
      throw new ConversionError("UNKNOWN", "Could not build the Excel workbook.");
    }
  } finally {
    releasePdfDocument(file);
  }
  });
}

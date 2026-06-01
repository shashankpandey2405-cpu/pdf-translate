/**
 * Document Reconstruction Engine v2 — builds clean professional PDFs from
 * structured vision AI analysis. Supports Unicode fallback, smart tables,
 * numbered lists, multi-column, address blocks, amount styling.
 */
import { PDFDocument, PDFPage, StandardFonts, rgb, PDFFont } from "pdf-lib";
import type { DocumentAnalysis, DocBlock, DocBlockType } from "@/server/ai/visionAnalyze";

type FontSet = {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_L = 50;
const MARGIN_R = 50;
const MARGIN_T = 50;
const MARGIN_B = 60;
const CONTENT_W = PAGE_WIDTH - MARGIN_L - MARGIN_R;

const FS: Record<string, number> = {
  title: 22, h1: 18, h2: 15, h3: 13, normal: 11, small: 9,
  large: 14, xlarge: 18, footer: 8, caption: 9, address: 10, amount: 12,
};

const LH: Record<string, number> = {
  title: 30, h1: 24, h2: 20, h3: 17, normal: 15, small: 12,
  large: 18, xlarge: 24, footer: 11, caption: 12, address: 14, amount: 16,
};

const C = {
  text: rgb(0.1, 0.1, 0.1),
  heading: rgb(0.05, 0.05, 0.15),
  muted: rgb(0.4, 0.4, 0.4),
  accent: rgb(0.15, 0.3, 0.6),
  tblBorder: rgb(0.7, 0.7, 0.7),
  tblHeader: rgb(0.93, 0.93, 0.97),
  tblAltRow: rgb(0.97, 0.97, 0.99),
  divider: rgb(0.8, 0.8, 0.8),
  amountBg: rgb(0.96, 0.98, 0.96),
  stampBorder: rgb(0.85, 0.2, 0.2),
  watermark: rgb(0.85, 0.85, 0.85),
};

const NON_LATIN_RE = /[^\x00-\x024F\s]/;

function sanitize(text: string): string {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, (ch) => {
    const c = ch.charCodeAt(0);
    if (c === 0x2018 || c === 0x2019) return "'";
    if (c === 0x201C || c === 0x201D) return '"';
    if (c === 0x2013 || c === 0x2014 || c === 0x2011) return "-";
    if (c === 0x2026) return "...";
    if (c === 0x2022 || c === 0x00B7) return "*";
    if (c === 0x00A0) return " ";
    if (c >= 0x0900 && c <= 0x097F) return ch; // Devanagari - will be filtered at draw
    if (c >= 0x0600 && c <= 0x06FF) return ch; // Arabic
    return " ";
  });
}

function safeDraw(page: PDFPage, text: string, opts: {
  x: number; y: number; size: number; font: PDFFont;
  color?: ReturnType<typeof rgb>; maxWidth?: number; opacity?: number;
}): void {
  try {
    const safe = sanitize(text);
    const filteredForFont = safe.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
    page.drawText(filteredForFont, opts);
  } catch {
    const ascii = text.replace(/[^\x20-\x7E]/g, "?");
    try { page.drawText(ascii, opts); } catch { /* skip unrenderable */ }
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    let w: number;
    try {
      w = font.widthOfTextAtSize(sanitize(test).replace(/[^\x20-\x7E\xA0-\xFF]/g, "?"), fontSize);
    } catch {
      w = test.length * fontSize * 0.5;
    }
    if (w > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function pickFont(block: DocBlock, f: FontSet): PDFFont {
  if (block.bold && block.italic) return f.boldItalic;
  if (block.bold) return f.bold;
  if (block.italic) return f.italic;
  return f.regular;
}

function blockFontSize(block: DocBlock): number {
  if (block.type === "title") return FS.title;
  if (block.type === "heading") return block.level === 1 ? FS.h1 : block.level === 3 ? FS.h3 : FS.h2;
  if (block.type === "subheading") return FS.h2;
  if (block.type === "footer" || block.type === "page_number") return FS.footer;
  if (block.type === "caption" || block.type === "watermark_text") return FS.caption;
  if (block.type === "address_block") return FS.address;
  if (block.type === "amount_field") return FS.amount;
  if (block.fontSize === "small") return FS.small;
  if (block.fontSize === "large") return FS.large;
  if (block.fontSize === "xlarge") return FS.xlarge;
  return FS.normal;
}

function blockLineHeight(block: DocBlock): number {
  if (block.type === "title") return LH.title;
  if (block.type === "heading") return block.level === 1 ? LH.h1 : block.level === 3 ? LH.h3 : LH.h2;
  if (block.type === "subheading") return LH.h2;
  if (block.type === "footer" || block.type === "page_number") return LH.footer;
  if (block.type === "caption" || block.type === "watermark_text") return LH.caption;
  if (block.type === "address_block") return LH.address;
  if (block.type === "amount_field") return LH.amount;
  if (block.fontSize === "small") return LH.small;
  if (block.fontSize === "large") return LH.large;
  if (block.fontSize === "xlarge") return LH.xlarge;
  return LH.normal;
}

function xAlign(textWidth: number, alignment: string | undefined, contentW: number, marginL: number): number {
  if (alignment === "center") return marginL + (contentW - textWidth) / 2;
  if (alignment === "right") return marginL + contentW - textWidth;
  return marginL;
}

function computeColWidths(data: string[][], contentW: number): number[] {
  const cols = Math.max(...data.map((r) => r.length), 1);
  const maxLens = new Array<number>(cols).fill(0);
  for (const row of data) {
    for (let c = 0; c < cols; c++) {
      maxLens[c] = Math.max(maxLens[c], (row[c] ?? "").length);
    }
  }
  const total = maxLens.reduce((a, b) => a + b, 0) || 1;
  const minCol = 40;
  return maxLens.map((len) => Math.max(minCol, (len / total) * contentW));
}

function estimateBlockHeight(block: DocBlock, colW: number, fonts: FontSet): number {
  const fs = blockFontSize(block);
  const lh = blockLineHeight(block);
  const text = block.text?.trim() ?? "";
  switch (block.type) {
    case "table": {
      const rows = block.tableData?.length ?? 1;
      return rows * 22 + 10;
    }
    case "signature":
      return 45;
    case "stamp_seal":
      return 55;
    case "barcode_qr":
    case "image_placeholder":
      return 60;
    case "divider":
      return 12;
    case "title":
    case "heading":
    case "subheading": {
      const lines = Math.max(1, Math.ceil(text.length / Math.max(24, colW / (fs * 0.5))));
      return lines * lh + 16;
    }
    case "list":
    case "numbered_list": {
      const items = block.listItems?.length ?? text.split("\n").filter(Boolean).length;
      return Math.max(1, items) * lh + 4;
    }
    case "address_block": {
      const lines = text.split("\n").filter(Boolean).length || 1;
      return lines * LH.address + 10;
    }
    default: {
      if (!text) return 8;
      const lines = Math.max(1, Math.ceil(text.length / Math.max(28, colW / (fs * 0.48))));
      return lines * lh + 6;
    }
  }
}

function fitScaleForAnalysis(
  blocks: DocBlock[],
  pageHeight: number,
  contentWidth: number,
  fonts: FontSet,
): number {
  const available = pageHeight - MARGIN_T - MARGIN_B;
  let needed = 0;
  for (const block of blocks) {
    needed += estimateBlockHeight(block, contentWidth, fonts);
  }
  if (needed <= available) return 1;
  return Math.max(0.68, available / needed);
}

// ---------------------------------------------------------------------------
// Main reconstruction
// ---------------------------------------------------------------------------
export async function reconstructDocument(
  analyses: DocumentAnalysis[],
  opts?: { addWatermark?: boolean; outputFormat?: "pdf" | "searchable-pdf"; onePagePerSource?: boolean },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: FontSet = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  doc.setTitle("Smart Scan AI — Reconstructed Document");
  doc.setProducer("PDFTrusted Smart Scan AI v2");
  doc.setCreator("PDFTrusted Smart Scan AI Engine");
  doc.setCreationDate(new Date());

  let pageNum = 0;

  for (const analysis of analyses) {
    pageNum++;
    const isLandscape = analysis.pageOrientation === "landscape";
    const pw = isLandscape ? PAGE_HEIGHT : PAGE_WIDTH;
    const ph = isLandscape ? PAGE_WIDTH : PAGE_HEIGHT;
    const cw = pw - MARGIN_L - MARGIN_R;

    let page = doc.addPage([pw, ph]);
    let y = ph - MARGIN_T;
    let inRightColumn = false;
    let columnSaveY = 0;
    const onePage = opts?.onePagePerSource !== false;
    const contentScale = onePage ? fitScaleForAnalysis(analysis.blocks, ph, cw, fonts) : 1;
    let overflowPages = 0;

    const scaledFs = (base: number) => Math.max(7, base * contentScale);
    const scaledLh = (base: number) => Math.max(9, base * contentScale);

    const ensure = (needed: number): void => {
      if (y - needed < MARGIN_B) {
        if (onePage && overflowPages < 1) {
          overflowPages += 1;
          page = doc.addPage([pw, ph]);
          y = ph - MARGIN_T;
          inRightColumn = false;
          return;
        }
        if (!onePage) {
          page = doc.addPage([pw, ph]);
          y = ph - MARGIN_T;
          inRightColumn = false;
        }
      }
    };

    const curML = () => inRightColumn ? MARGIN_L + cw / 2 + 10 : MARGIN_L;
    const curCW = () => inRightColumn ? cw / 2 - 10 : cw;

    for (let bi = 0; bi < analysis.blocks.length; bi++) {
      const block = analysis.blocks[bi];
      const font = pickFont(block, fonts);
      const fs = scaledFs(blockFontSize(block));
      const lh = scaledLh(blockLineHeight(block));
      const text = block.text?.trim() ?? "";
      const ml = curML();
      const colW = curCW();

      switch (block.type) {
        // ── COLUMN BREAK ─────────────────────────────────
        case "column_break": {
          if (!inRightColumn) {
            columnSaveY = y;
            inRightColumn = true;
            y = ph - MARGIN_T;
          } else {
            inRightColumn = false;
            y = Math.min(y, columnSaveY);
          }
          break;
        }

        // ── TITLE ────────────────────────────────────────
        case "title": {
          ensure(lh + 20);
          y -= 6;
          const lines = wrapText(text, fonts.bold, fs, colW);
          for (const line of lines) {
            const tw = textWidth(line, fonts.bold, fs);
            const x = xAlign(tw, block.alignment ?? "center", colW, ml);
            safeDraw(page, line, { x, y, size: fs, font: fonts.bold, color: C.heading });
            y -= lh;
          }
          y -= 12;
          break;
        }

        // ── HEADINGS ─────────────────────────────────────
        case "heading":
        case "subheading": {
          const spacing = block.type === "heading" ? 14 : 10;
          ensure(lh + spacing);
          y -= spacing;
          const hf = fonts.bold;
          const lines = wrapText(text, hf, fs, colW);
          for (const line of lines) {
            safeDraw(page, line, { x: ml, y, size: fs, font: hf, color: C.heading });
            y -= lh;
          }
          y -= 4;
          break;
        }

        // ── PARAGRAPH ────────────────────────────────────
        case "paragraph": {
          if (!text) { y -= 8; break; }
          const lines = wrapText(text, font, fs, colW);
          ensure(lh * Math.min(lines.length, 3));
          for (const line of lines) {
            ensure(lh);
            const tw = textWidth(line, font, fs);
            const x = xAlign(tw, block.alignment, colW, ml);
            safeDraw(page, line, { x, y, size: fs, font, color: C.text });
            y -= lh;
          }
          y -= 6;
          break;
        }

        // ── BULLET LIST ──────────────────────────────────
        case "list": {
          const items = block.listItems?.length ? block.listItems : text.split("\n").filter(Boolean);
          ensure(lh * Math.min(items.length, 2));
          for (const item of items) {
            ensure(lh);
            const bullet = `  \u2022  ${item}`;
            const lines = wrapText(bullet, fonts.regular, fs, colW - 20);
            for (const line of lines) {
              safeDraw(page, line, { x: ml + 10, y, size: fs, font: fonts.regular, color: C.text });
              y -= lh;
            }
          }
          y -= 4;
          break;
        }

        // ── NUMBERED LIST ────────────────────────────────
        case "numbered_list": {
          const items = block.listItems?.length ? block.listItems : text.split("\n").filter(Boolean);
          ensure(lh * Math.min(items.length, 2));
          for (let ni = 0; ni < items.length; ni++) {
            ensure(lh);
            const numbered = `  ${ni + 1}.  ${items[ni]}`;
            const lines = wrapText(numbered, fonts.regular, fs, colW - 25);
            for (const line of lines) {
              safeDraw(page, line, { x: ml + 10, y, size: fs, font: fonts.regular, color: C.text });
              y -= lh;
            }
          }
          y -= 4;
          break;
        }

        // ── TABLE (smart widths + alt-row shading) ───────
        case "table": {
          const data = block.tableData;
          if (!data?.length) break;
          const cols = Math.max(...data.map((r) => r.length));
          const colWidths = computeColWidths(data, colW);
          const rowH = 22;
          ensure(Math.min(data.length * rowH, 100));

          for (let ri = 0; ri < data.length; ri++) {
            ensure(rowH + 4);
            const row = data[ri];
            const isHeader = ri === 0;
            const isAlt = ri > 0 && ri % 2 === 0;
            let cellX = ml;

            if (isHeader || isAlt) {
              const totalW = colWidths.reduce((a, b) => a + b, 0);
              page.drawRectangle({
                x: ml, y: y - rowH + 4,
                width: Math.min(totalW, colW), height: rowH,
                color: isHeader ? C.tblHeader : C.tblAltRow,
              });
            }

            for (let ci = 0; ci < cols; ci++) {
              const cWidth = colWidths[ci] ?? colWidths[colWidths.length - 1] ?? 80;
              page.drawRectangle({
                x: cellX, y: y - rowH + 4,
                width: cWidth, height: rowH,
                borderColor: C.tblBorder, borderWidth: 0.5,
              });
              const cellText = (row[ci] ?? "").slice(0, 80);
              const cellFont = isHeader ? fonts.bold : fonts.regular;
              const cellFs = isHeader ? 10 : 9;
              safeDraw(page, cellText, {
                x: cellX + 4, y: y - rowH + 10,
                size: cellFs, font: cellFont, color: C.text,
                maxWidth: cWidth - 8,
              });
              cellX += cWidth;
            }
            y -= rowH;
          }
          y -= 10;
          break;
        }

        // ── CHECKBOX ─────────────────────────────────────
        case "checkbox": {
          ensure(lh + 4);
          const mark = block.checked ? "[x]" : "[ ]";
          safeDraw(page, `${mark}  ${text}`, { x: ml, y, size: fs, font: fonts.regular, color: C.text });
          y -= lh + 2;
          break;
        }

        // ── FORM FIELD ───────────────────────────────────
        case "form_field": {
          ensure(lh + 6);
          safeDraw(page, text, { x: ml, y, size: fs, font: fonts.regular, color: C.text });
          page.drawLine({
            start: { x: ml, y: y - 3 },
            end: { x: ml + Math.min(colW * 0.65, 320), y: y - 3 },
            thickness: 0.5, color: C.muted,
          });
          y -= lh + 4;
          break;
        }

        // ── DATE FIELD ───────────────────────────────────
        case "date_field": {
          ensure(lh + 2);
          safeDraw(page, text, { x: ml, y, size: fs, font: fonts.bold, color: C.accent });
          y -= lh + 2;
          break;
        }

        // ── AMOUNT FIELD ─────────────────────────────────
        case "amount_field": {
          ensure(lh + 4);
          const amountFs = FS.amount;
          const tw = textWidth(text, fonts.bold, amountFs);
          const x = xAlign(tw, "right", colW, ml);
          page.drawRectangle({
            x: x - 4, y: y - 4,
            width: tw + 8, height: lh + 2,
            color: C.amountBg,
          });
          safeDraw(page, text, { x, y, size: amountFs, font: fonts.bold, color: C.text });
          y -= lh + 6;
          break;
        }

        // ── ADDRESS BLOCK ────────────────────────────────
        case "address_block": {
          ensure(lh * 3);
          y -= 4;
          const addrLines = text.split("\n").filter(Boolean);
          for (const line of addrLines) {
            ensure(LH.address);
            safeDraw(page, line, { x: ml + 15, y, size: FS.address, font: fonts.regular, color: C.text });
            y -= LH.address;
          }
          y -= 6;
          break;
        }

        // ── SIGNATURE ────────────────────────────────────
        case "signature": {
          ensure(45);
          y -= 10;
          page.drawLine({
            start: { x: ml, y }, end: { x: ml + 200, y },
            thickness: 0.75, color: C.text,
          });
          y -= 13;
          safeDraw(page, text || "Signature", { x: ml, y, size: 8, font: fonts.italic, color: C.muted });
          y -= 18;
          break;
        }

        // ── STAMP / SEAL ─────────────────────────────────
        case "stamp_seal": {
          ensure(55);
          const stampW = 120;
          const stampH = 40;
          const cx = ml + colW / 2;
          page.drawRectangle({
            x: cx - stampW / 2, y: y - stampH,
            width: stampW, height: stampH,
            borderColor: C.stampBorder, borderWidth: 1.5,
          });
          safeDraw(page, text || "[Official Stamp]", {
            x: cx - stampW / 2 + 8, y: y - stampH / 2 - 4,
            size: 8, font: fonts.bold, color: C.stampBorder,
          });
          y -= stampH + 10;
          break;
        }

        // ── BARCODE / QR ─────────────────────────────────
        case "barcode_qr": {
          ensure(50);
          const bw = 80;
          const bh = 40;
          page.drawRectangle({
            x: ml, y: y - bh,
            width: bw, height: bh,
            borderColor: C.tblBorder, borderWidth: 0.5,
          });
          safeDraw(page, text || "[Barcode/QR]", {
            x: ml + 6, y: y - bh / 2 - 4,
            size: 7, font: fonts.italic, color: C.muted,
          });
          y -= bh + 8;
          break;
        }

        // ── IMAGE PLACEHOLDER ────────────────────────────
        case "image_placeholder": {
          if (block.embeddedImage?.base64) {
            try {
              const bytes = Buffer.from(block.embeddedImage.base64, "base64");
              const mime = block.embeddedImage.mimeType.toLowerCase();
              const img = mime.includes("png")
                ? await doc.embedPng(bytes)
                : await doc.embedJpg(bytes);
              const ratio = block.embeddedImage.widthRatio ?? 0.35;
              const drawW = colW * Math.min(1, Math.max(0.12, ratio));
              const scale = drawW / img.width;
              const drawH = img.height * scale;
              ensure(drawH + 12);
              const x =
                block.alignment === "center"
                  ? ml + (colW - drawW) / 2
                  : block.alignment === "right"
                    ? ml + colW - drawW
                    : ml;
              page.drawImage(img, { x, y: y - drawH, width: drawW, height: drawH });
              y -= drawH + 12;
              break;
            } catch {
              /* fall through to text placeholder */
            }
          }
          ensure(60);
          const boxH = 50;
          page.drawRectangle({
            x: ml, y: y - boxH,
            width: colW * 0.5, height: boxH,
            borderColor: C.divider, borderWidth: 0.5,
          });
          safeDraw(page, text || "[Image]", {
            x: ml + 8, y: y - boxH / 2 - 4,
            size: 8, font: fonts.italic, color: C.muted,
          });
          y -= boxH + 10;
          break;
        }

        // ── WATERMARK ────────────────────────────────────
        case "watermark_text": {
          safeDraw(page, text, {
            x: pw / 2 - 60, y: ph / 2,
            size: 24, font: fonts.bold, color: C.watermark, opacity: 0.15,
          });
          break;
        }

        // ── HEADER / FOOTER / PAGE NUMBER ────────────────
        case "header": {
          const tw = textWidth(text, fonts.regular, 8);
          safeDraw(page, text, {
            x: xAlign(tw, block.alignment ?? "center", colW, ml),
            y: ph - 30, size: 8, font: fonts.regular, color: C.muted,
          });
          break;
        }
        case "footer":
        case "page_number": {
          const tw = textWidth(text, fonts.regular, 8);
          safeDraw(page, text, {
            x: xAlign(tw, block.alignment ?? "center", colW, ml),
            y: 30, size: 8, font: fonts.regular, color: C.muted,
          });
          break;
        }

        // ── DIVIDER ──────────────────────────────────────
        case "divider": {
          ensure(12);
          y -= 4;
          page.drawLine({
            start: { x: ml, y }, end: { x: ml + colW, y },
            thickness: 0.5, color: C.divider,
          });
          y -= 8;
          break;
        }

        // ── CAPTION ──────────────────────────────────────
        case "caption": {
          if (!text) break;
          ensure(lh);
          safeDraw(page, text, { x: ml, y, size: FS.caption, font: fonts.italic, color: C.muted });
          y -= lh;
          break;
        }

        // ── DEFAULT (any unrecognized type) ──────────────
        default: {
          if (!text) break;
          const lines = wrapText(text, fonts.regular, FS.normal, colW);
          for (const line of lines) {
            ensure(LH.normal);
            safeDraw(page, line, { x: ml, y, size: FS.normal, font: fonts.regular, color: C.text });
            y -= LH.normal;
          }
          y -= 4;
        }
      }
    }

    if (opts?.addWatermark) {
      safeDraw(page, "Reconstructed by PDFTrusted Smart Scan AI", {
        x: pw / 2 - 130, y: 15, size: 7, font: fonts.bold,
        color: rgb(0.7, 0.7, 0.7), opacity: 0.5,
      });
    }
  }

  return new Uint8Array(await doc.save());
}

function textWidth(text: string, font: PDFFont, size: number): number {
  try {
    const safe = sanitize(text).replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
    return font.widthOfTextAtSize(safe, size);
  } catch {
    return text.length * size * 0.5;
  }
}

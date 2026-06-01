import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** Rebuild PDF with translated text (same page sizes; reflowed text boxes). */
export async function buildTranslatedPdf(
  sourceBytes: Uint8Array,
  translatedPages: string[],
): Promise<Uint8Array> {
  try {
    const src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    const out = await PDFDocument.create();
    const font = await out.embedFont(StandardFonts.Helvetica);
    const pageCount = Math.min(src.getPageCount(), translatedPages.length || src.getPageCount());

    for (let i = 0; i < pageCount; i += 1) {
      const srcPage = src.getPage(i);
      const { width, height } = srcPage.getSize();
      const page = out.addPage([width, height]);
      const margin = 48;
      const raw = translatedPages[i] ?? "";
      const text = sanitizeForWinAnsi(raw);
      if (!text.trim()) {
        page.drawText(`[Page ${i + 1}: Translation contains non-Latin characters — see summary below]`, {
          x: margin,
          y: height - margin - 14,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        continue;
      }
      const fontSize = 11;
      const lineHeight = fontSize * 1.35;
      const maxWidth = width - margin * 2;
      const lines = wrapText(text, font, fontSize, maxWidth);
      let y = height - margin;
      for (const line of lines) {
        if (y < margin) break;
        page.drawText(line, {
          x: margin,
          y: y - fontSize,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
          maxWidth,
        });
        y -= lineHeight;
      }
    }

    return out.save();
  } catch (err) {
    console.error("[buildTranslatedPdf] PDF build failed, falling back to plain text PDF:", err);
    return buildFallbackTranslatedPdf(translatedPages);
  }
}

async function buildFallbackTranslatedPdf(pages: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  const margin = 50;
  let y = 792;

  page.drawText("PDF Translation — PDFTrusted AI", {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.35),
  });
  y -= 36;

  const combined = pages
    .map((p, i) => `--- Page ${i + 1} ---\n${sanitizeForWinAnsi(p)}`)
    .join("\n\n");
  const lines = wrapText(combined, font, 11, 495);

  for (const line of lines) {
    if (y < margin + 15) {
      page = doc.addPage([595, 842]);
      y = 792;
    }
    page.drawText(line, { x: margin, y: y - 11, size: 11, font, maxWidth: 495 });
    y -= 15;
  }

  return doc.save();
}

export async function buildSummaryPdf(summaryText: string, title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  const margin = 50;
  let y = 792;

  const safeTitle = sanitizeForWinAnsi(title);
  page.drawText(safeTitle, { x: margin, y, size: 16, font: bold, color: rgb(0.1, 0.1, 0.35) });
  y -= 36;

  const fontSize = 11;
  const lineHeight = 15;
  const maxWidth = 495;
  const lines = wrapText(summaryText, font, fontSize, maxWidth);

  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = doc.addPage([595, 842]);
      y = 792;
    }
    page.drawText(line, { x: margin, y: y - fontSize, size: fontSize, font, maxWidth });
    y -= lineHeight;
  }

  return doc.save();
}

/** Replace Unicode chars that WinAnsi (Helvetica) cannot encode. */
function sanitizeForWinAnsi(text: string): string {
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "*")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\u2002/g, " ")
    .replace(/\u2003/g, " ")
    .replace(/\u00B7/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/[\u00BC]/g, "1/4")
    .replace(/[\u00BD]/g, "1/2")
    .replace(/[\u00BE]/g, "3/4")
    .replace(/[^\x00-\xFF]/g, "");
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number): string[] {
  const safe = sanitizeForWinAnsi(text);
  const paragraphs = safe.split(/\n+/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      const w = font.widthOfTextAtSize(next, size);
      if (w > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

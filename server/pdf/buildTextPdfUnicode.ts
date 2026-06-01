import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { embedUnicodeCapableFont } from "@/server/pdf/unicodePdfFont";
import { textNeedsUnicodeFont } from "@/lib/pdf/textPdfUnicode";

export async function buildTextPdfExportUnicode(params: {
  pageTexts: string[];
  sourcePdfBytes: Uint8Array;
  title: string;
}): Promise<Uint8Array> {
  const { pageTexts, sourcePdfBytes, title } = params;
  let sizes: Array<[number, number]> = [];

  try {
    const src = await PDFDocument.load(sourcePdfBytes, { ignoreEncryption: true });
    sizes = src.getPages().map((p) => {
      const { width, height } = p.getSize();
      return [width, height] as [number, number];
    });
  } catch {
    sizes = [];
  }

  const doc = await PDFDocument.create();
  const combined = pageTexts.join("");
  const font = textNeedsUnicodeFont(combined)
    ? await embedUnicodeCapableFont(doc)
    : await doc.embedFont(StandardFonts.Helvetica);
  const margin = 48;

  for (let i = 0; i < pageTexts.length; i += 1) {
    const [width, height] = sizes[i] ?? [595, 842];
    const page = doc.addPage([width, height]);
    const text = pageTexts[i]?.trim() ?? "";
    if (!text) continue;

    const fontSize = 11;
    const maxWidth = width - margin * 2;
    const lines = wrapLines(text, maxWidth, fontSize);
    let y = height - margin;
    for (const line of lines) {
      if (y < margin) break;
      try {
        page.drawText(line, {
          x: margin,
          y: y - fontSize,
          size: fontSize,
          font,
          color: rgb(0.08, 0.08, 0.1),
          maxWidth,
        });
      } catch {
        /* skip bad glyphs */
      }
      y -= fontSize * 1.35;
    }
  }

  if (doc.getPageCount() === 0) {
    const page = doc.addPage([595, 842]);
    page.drawText(title, { x: margin, y: 794, size: 14, font });
  }

  stampTrustShieldMetadata(doc);
  return doc.save();
}

function wrapLines(text: string, maxWidth: number, fontSize: number): string[] {
  const approxChars = Math.max(20, Math.floor(maxWidth / (fontSize * 0.5)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > approxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text.slice(0, approxChars)];
}

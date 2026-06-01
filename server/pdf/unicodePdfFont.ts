import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";

const FONT_CANDIDATES = [
  "node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff",
  "node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-latin-400-normal.woff",
];

export async function embedUnicodeCapableFont(doc: PDFDocument): Promise<PDFFont> {
  doc.registerFontkit(fontkit);
  for (const rel of FONT_CANDIDATES) {
    const full = path.join(process.cwd(), rel);
    if (!fs.existsSync(full)) continue;
    try {
      const data = fs.readFileSync(full);
      return await doc.embedFont(data);
    } catch {
      /* try next */
    }
  }
  return doc.embedFont(StandardFonts.Helvetica);
}

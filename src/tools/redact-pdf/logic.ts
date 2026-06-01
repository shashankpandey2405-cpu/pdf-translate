import { PDFDocument, rgb } from "pdf-lib";
import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";
import {
  assertWithinBrowserPageCap,
  getPageProcessingChunkSize,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { ConversionError } from "@/tools/conversions/ConversionError";

export type RedactPatternKey = "email" | "creditCard" | "phone";

export type RedactOptions = {
  patterns: RedactPatternKey[];
  customRegex?: string[];
};

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const CC_RE = /\b(?:\d[ -]*?){13,19}\b/g;
const PHONE_RE = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/g;

type TextBox = { pageIndex: number; x: number; y: number; w: number; h: number; text: string };

function buildRegexes(options: RedactOptions): RegExp[] {
  const list: RegExp[] = [];
  if (options.patterns.includes("email")) list.push(EMAIL_RE);
  if (options.patterns.includes("creditCard")) list.push(CC_RE);
  if (options.patterns.includes("phone")) list.push(PHONE_RE);
  for (const raw of options.customRegex ?? []) {
    try {
      list.push(new RegExp(raw, "gi"));
    } catch {
      /* skip invalid */
    }
  }
  return list;
}

async function extractTextBoxes(file: File): Promise<TextBox[]> {
  const pdfjsLib = await import("pdfjs-dist");
  configurePdfJsWorker(pdfjsLib);
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
  const boxes: TextBox[] = [];
  assertWithinBrowserPageCap(pdf.numPages);
  const chunk = getPageProcessingChunkSize();

  try {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const text = await page.getTextContent({ includeMarkedContent: false });
      const items = text.items as Array<{ str?: string; transform?: number[]; width?: number }>;

      for (const item of items) {
        const str = typeof item.str === "string" ? item.str : "";
        if (!str || !item.transform || item.transform.length < 6) continue;
        const m = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const xScale = Math.hypot(m[0], m[1]);
        let w = typeof item.width === "number" ? Math.abs(item.width) * xScale : str.length * 6;
        if (!w || w < 2) w = Math.max(12, str.length * 5);
        const h = Math.hypot(m[2], m[3]) || 12;
        const x = m[4];
        const yTop = m[5] - h;
        boxes.push({
          pageIndex: pageNum - 1,
          x,
          y: yTop,
          w,
          h: h * 1.1,
          text: str,
        });
      }
      try {
        page.cleanup();
      } catch {
        /* ignore */
      }
      if (pageNum % chunk === 0) await yieldToMain();
    }
  } finally {
    void pdf.destroy();
  }
  return boxes;
}

function findRedactRects(boxes: TextBox[], regexes: RegExp[]): TextBox[] {
  const hits: TextBox[] = [];
  for (const box of boxes) {
    for (const re of regexes) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(box.text)) !== null) {
        const start = m.index;
        const len = m[0].length;
        const ratio = box.text.length > 0 ? len / box.text.length : 1;
        const offset = box.text.length > 0 ? start / box.text.length : 0;
        hits.push({
          ...box,
          x: box.x + box.w * offset,
          w: Math.max(8, box.w * ratio),
          text: m[0],
        });
      }
    }
  }
  return hits;
}

export async function redactPdf(file: File, options: RedactOptions): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
  const regexes = buildRegexes(options);
  if (regexes.length === 0) {
    throw new ConversionError("UNSUPPORTED", "Select at least one redaction pattern.");
  }

  const boxes = await extractTextBoxes(file);
  const rects = findRedactRects(boxes, regexes);
  if (rects.length === 0) {
    throw new ConversionError("EMPTY", "No matching text found for the selected patterns.");
  }

  const buf = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const r of rects) {
    const page = pages[r.pageIndex];
    if (!page) continue;
    const { height } = page.getSize();
    const pdfY = height - (r.y + r.h);
    page.drawRectangle({
      x: r.x - 1,
      y: pdfY - 1,
      width: r.w + 2,
      height: r.h + 2,
      color: rgb(0, 0, 0),
      opacity: 1,
    });
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
  });
}

export function getRedactedFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + "_redacted.pdf";
}

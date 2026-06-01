import type { TextBlock } from "@/server/translate/types";

export async function extractTextBlocks(
  bytes: Uint8Array,
  maxPages: number,
  pageOffset = 0,
): Promise<TextBlock[]> {
  const { detachedPdfBytes } = await import("@/server/pdf/pdfBytes");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: detachedPdfBytes(bytes),
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const startPage = Math.max(0, pageOffset) + 1;
  const endPage = Math.min(doc.numPages, startPage + Math.max(1, maxPages) - 1);
  const blocks: TextBlock[] = [];
  let key = 0;

  try {
    for (let pageNum = startPage; pageNum <= endPage; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const pageHeight = viewport.height;
      const text = await page.getTextContent({ includeMarkedContent: false });
      const items = text.items as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
        fontName?: string;
      }>;

      for (const item of items) {
        const str = typeof item.str === "string" ? item.str : "";
        if (!str.trim() || !item.transform || item.transform.length < 6) continue;

        const m = pdfjs.Util.transform(viewport.transform, item.transform);
        const xScale = Math.hypot(m[0], m[1]);
        let w = typeof item.width === "number" ? Math.abs(item.width) * xScale : 0;
        if (!w || w < 2) w = Math.max(8, str.length * 5);
        const h = Math.hypot(m[2], m[3]) || Math.max(8, Math.abs(m[3]));
        const x = m[4];
        const topY = m[5] - h;
        const y = pageHeight - topY - h;
        const fontSize = Math.max(6, Math.min(h, xScale || h));
        const rotation = Math.round((Math.atan2(m[1], m[0]) * 180) / Math.PI);

        blocks.push({
          id: `b${key++}`,
          pageIndex: pageNum - 1,
          text: str,
          x,
          y,
          width: w,
          height: h,
          fontSize,
          fontName: item.fontName,
          rotation: Math.abs(rotation) > 2 ? rotation : 0,
          alignment: "left",
        });
      }
    }
  } finally {
    await doc.destroy();
  }

  return blocks;
}

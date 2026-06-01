/** Server-side PDF text extraction (Node) for AI pipelines. */

export type PageText = { pageNumber: number; text: string };

export async function extractPdfTextFromBytes(
  bytes: Uint8Array,
  maxPages: number,
): Promise<PageText[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;
  const limit = Math.min(doc.numPages, Math.max(1, maxPages));
  const pages: PageText[] = [];

  for (let i = 1; i <= limit; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const str = (item as { str?: string }).str;
        return typeof str === "string" ? str : "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageNumber: i, text });
    page.cleanup();
  }

  await doc.destroy();
  return pages;
}

export function totalExtractedChars(pages: PageText[]): number {
  return pages.reduce((n, p) => n + p.text.length, 0);
}

import type { TranslateAnalyzeResult } from "@/server/translate/types";

const MIN_DIGITAL_CHARS_PER_PAGE = 80;
const SCANNED_AVG_CHARS = 120;

type TextItem = { str?: string; fontName?: string };

export async function analyzePdfBytes(bytes: Uint8Array): Promise<TranslateAnalyzeResult> {
  const { detachedPdfBytes } = await import("@/server/pdf/pdfBytes");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: detachedPdfBytes(bytes),
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;

  const pages = doc.numPages;
  const sample = Math.min(pages, 8);
  let textCharCount = 0;
  const fontSet = new Set<string>();
  const perPageChars: number[] = [];

  try {
    for (let i = 1; i <= sample; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent({ includeMarkedContent: false });
      let pageChars = 0;
      for (const item of content.items as TextItem[]) {
        const s = typeof item.str === "string" ? item.str.trim() : "";
        pageChars += s.length;
        if (item.fontName) fontSet.add(item.fontName);
      }
      perPageChars.push(pageChars);
      textCharCount += pageChars;
    }
  } finally {
    await doc.destroy();
  }

  const scale = pages / Math.max(sample, 1);
  const estimatedChars = Math.round(textCharCount * scale);
  const avgCharsPerPage = estimatedChars / Math.max(pages, 1);
  const sparsePages = perPageChars.filter((c) => c < MIN_DIGITAL_CHARS_PER_PAGE).length;
  const sparseRatio = sparsePages / Math.max(perPageChars.length, 1);

  const isScanned =
    avgCharsPerPage < SCANNED_AVG_CHARS &&
    (sparseRatio >= 0.55 || Math.min(...perPageChars, 0) < 40);
  const isDigital = !isScanned && avgCharsPerPage >= MIN_DIGITAL_CHARS_PER_PAGE;

  const recommendedEngine: "classic" | "ai" = isDigital ? "classic" : "ai";
  const reason = isScanned
    ? "This PDF looks scanned or has a weak text layer. Use AI translation with OCR/vision."
    : isDigital
      ? "Selectable text detected — Classic translation preserves layout without AI."
      : "Mixed or sparse text — AI translation recommended.";

  return {
    isDigital,
    isScanned,
    pages,
    fonts: [...fontSet].slice(0, 24),
    language: "en",
    textCharCount: estimatedChars,
    avgCharsPerPage: Math.round(avgCharsPerPage),
    recommendedEngine,
    reason,
  };
}

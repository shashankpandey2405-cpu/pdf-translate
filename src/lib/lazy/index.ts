export { loadPdfJs } from "@/lib/lazy/pdfjs";
export { loadPdfLib } from "@/lib/lazy/pdfLib";
export { loadFabric } from "@/lib/lazy/fabric";
export { loadMupdf } from "@/lib/lazy/mupdf";
export { loadOpenCv } from "@/lib/lazy/opencv";
export { loadTesseract } from "@/lib/lazy/tesseract";
export { loadXlsx } from "@/lib/lazy/xlsx";

import { loadPdfJs } from "@/lib/lazy/pdfjs";

/** Prefetch pdf.js on first drop-zone interaction (non-blocking). */
export function prefetchPdfStack(): void {
  if (typeof window === "undefined") return;
  void loadPdfJs();
}

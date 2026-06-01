/** Lazy Tesseract.js — image OCR only (not PDF OCR). */
let tesseractPromise: Promise<typeof import("tesseract.js")> | null = null;

export async function loadTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js");
  }
  return tesseractPromise;
}

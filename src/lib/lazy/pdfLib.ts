/** Lazy pdf-lib — structural PDF ops (merge, split, compress metadata, etc.). */
let pdfLibPromise: Promise<typeof import("pdf-lib")> | null = null;

export async function loadPdfLib() {
  if (!pdfLibPromise) {
    pdfLibPromise = import("pdf-lib");
  }
  return pdfLibPromise;
}

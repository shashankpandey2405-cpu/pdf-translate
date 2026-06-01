import { PDFDocument } from "pdf-lib";

/** Extract selected pages into a new PDF buffer (worker-safe). */
export async function splitPdfPagesBuffer(
  buffer: ArrayBuffer,
  pageIndices: number[],
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  return newPdf.save();
}

/** One PDF per page index — streams via callback to avoid holding all outputs in RAM. */
export async function splitPdfSeparateBuffers(
  buffer: ArrayBuffer,
  pageIndices: number[],
  onPage?: (bytes: Uint8Array, index: number) => void | Promise<void>,
): Promise<Uint8Array[]> {
  const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const results: Uint8Array[] = [];
  for (let i = 0; i < pageIndices.length; i++) {
    const idx = pageIndices[i]!;
    const singlePage = await PDFDocument.create();
    const [copiedPage] = await singlePage.copyPages(srcPdf, [idx]);
    singlePage.addPage(copiedPage);
    const saved = await singlePage.save();
    if (onPage) await onPage(saved, i);
    results.push(saved);
  }
  return results;
}

import { PDFDocument } from "pdf-lib";

/** Extract a single page from a PDF as its own one-page PDF bytes (0-based page index). */
export async function extractSinglePdfPageBytes(
  pdfBytes: Uint8Array,
  pageIndex: number,
): Promise<Uint8Array> {
  const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`page_out_of_range:${pageIndex + 1}/${pageCount}`);
  }

  const dst = await PDFDocument.create();
  const [copied] = await dst.copyPages(src, [pageIndex]);
  dst.addPage(copied);
  return dst.save();
}

export async function extractPdfPagesForVision(
  pdfBytes: Uint8Array,
  maxPages: number,
): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const count = Math.min(src.getPageCount(), Math.max(1, maxPages));
  const out: Uint8Array[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(await extractSinglePdfPageBytes(pdfBytes, i));
  }
  return out;
}

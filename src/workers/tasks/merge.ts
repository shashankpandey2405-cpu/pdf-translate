import { PDFDocument } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export async function mergePdfBuffers(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (let i = 0; i < buffers.length; i++) {
    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(buffers[i]!, { ignoreEncryption: true });
    } catch {
      throw new Error(`Failed to load PDF #${i + 1}. The file may be corrupted or password-protected.`);
    }
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  mergedPdf.setTitle("Merged Document");
  stampTrustShieldMetadata(mergedPdf);
  return mergedPdf.save();
}

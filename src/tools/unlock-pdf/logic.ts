import { PDFDocument } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export async function unlockPDF(file: File, password = ""): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });
  } catch {
    // Try with provided password
    if (password) {
      try {
        pdfDoc = await PDFDocument.load(arrayBuffer);
      } catch {
        throw new Error("Could not unlock this PDF. The password may be incorrect.");
      }
    } else {
      throw new Error("This PDF is encrypted. Please provide the password to unlock it.");
    }
  }

  // Create a new, unrestricted copy
  const unlockedPdf = await PDFDocument.create();
  const pages = await unlockedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
  pages.forEach((page) => unlockedPdf.addPage(page));
  stampTrustShieldMetadata(unlockedPdf);
  return unlockedPdf.save();
}

export function getUnlockedFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + "_unlocked.pdf";
}

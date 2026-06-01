import type { PDFDocument } from "pdf-lib";

/** Embeds TrustShield branding in every exported PDF (searchable metadata, not visible watermark). */
export function stampTrustShieldMetadata(pdfDoc: PDFDocument): void {
  pdfDoc.setCreator("PDFTrusted");
  pdfDoc.setProducer("Securely Processed by PDFTrusted — in-browser RAM-only engine");
  pdfDoc.setKeywords([
    "PDFTrusted",
    "Secure iLovePDF alternative",
    "Free PDF editor no sign-up",
    "High-speed PDF converter",
  ]);
}

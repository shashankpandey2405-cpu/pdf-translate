import { PDFDocument } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export type CompressionLevel = "extreme" | "recommended" | "less";

export async function compressPdfBuffer(
  buffer: ArrayBuffer,
  level: CompressionLevel,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  if (level === "extreme" || level === "recommended") {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
  }
  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save({
    useObjectStreams: level === "extreme" || level === "recommended",
    addDefaultPage: false,
    objectsPerTick: level === "extreme" ? 50 : level === "recommended" ? 30 : 20,
  });
}

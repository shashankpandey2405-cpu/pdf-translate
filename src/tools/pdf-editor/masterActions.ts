import { PDFDocument } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { mergePDFs } from "@/tools/merge-pdf/logic";
import type { CompressionLevel } from "@/tools/compress-pdf/logic";
import { compressPDF } from "@/tools/compress-pdf/logic";
import type { RotationAngle } from "@/tools/rotate-pdf/logic";
import { rotatePDF } from "@/tools/rotate-pdf/logic";

/** Remove one page by index (0-based). Keeps remaining pages in order. */
export async function deletePageFromPdf(file: File, pageIndexToRemove: number): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const indices = src.getPageIndices().filter((i) => i !== pageIndexToRemove);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((p) => out.addPage(p));
  stampTrustShieldMetadata(out);
  return out.save();
}

/** Current PDF first, then each additional document appended in full. */
export async function appendPdfFiles(current: File, additions: File[]): Promise<Uint8Array> {
  if (additions.length === 0) {
    const b = await current.arrayBuffer();
    return new Uint8Array(b);
  }
  return mergePDFs([current, ...additions]);
}

export async function compressCurrentPdf(file: File, level: CompressionLevel): Promise<Uint8Array> {
  return compressPDF(file, { level });
}

export async function rotateEditorPage(file: File, pageIndex: number, angle: RotationAngle): Promise<Uint8Array> {
  return rotatePDF(file, [{ pageIndex, angle }]);
}

import { ConversionError } from "@/tools/conversions/ConversionError";

const PDF_HEADER = "%PDF-";

export function validatePdfBytes(bytes: Uint8Array): void {
  if (bytes.byteLength < 8) {
    throw new ConversionError("STRUCTURE", "File is too small to be a valid PDF.");
  }
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(1024, bytes.byteLength)));
  const trimmed = head.replace(/^\uFEFF/, "").trimStart();
  if (!trimmed.startsWith(PDF_HEADER) && !head.includes(PDF_HEADER)) {
    throw new ConversionError(
      "STRUCTURE",
      "Invalid PDF structure — the file is not a readable PDF (missing %PDF- header).",
    );
  }
}

export async function readPdfFileBytes(file: File): Promise<Uint8Array> {
  if (!file.size) {
    throw new ConversionError("EMPTY", "The selected file is empty.");
  }
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

export async function readAndValidatePdfFile(file: File): Promise<Uint8Array> {
  const bytes = await readPdfFileBytes(file);
  validatePdfBytes(bytes);
  return bytes;
}

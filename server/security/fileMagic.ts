export type AllowedUploadKind = "pdf" | "zip" | "image" | "office";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46]; // RIFF....WEBP
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((b, i) => bytes[i] === b);
}

export function sniffUploadKind(bytes: Uint8Array): AllowedUploadKind | null {
  if (bytes.length < 4) return null;
  if (startsWith(bytes, PDF_MAGIC)) return "pdf";
  if (startsWith(bytes, PNG_MAGIC) || startsWith(bytes, JPEG_MAGIC)) return "image";
  if (startsWith(bytes, ZIP_MAGIC)) return "zip";
  if (startsWith(bytes, WEBP_RIFF) && bytes.length >= 12) {
    const tag = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
    if (tag === "WEBP") return "image";
  }
  return null;
}

const MIME_TO_KIND: Record<string, AllowedUploadKind[]> = {
  "application/pdf": ["pdf"],
  "image/png": ["image"],
  "image/jpeg": ["image"],
  "image/jpg": ["image"],
  "image/webp": ["image"],
  "application/zip": ["zip"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["zip"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["zip"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["zip"],
};

export function contentTypeMatchesMagic(contentType: string, bytes: Uint8Array): boolean {
  const ct = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const allowed = MIME_TO_KIND[ct];
  const kind = sniffUploadKind(bytes);
  if (!allowed?.length) {
    if (kind) return true;
    return bytes.length >= 256;
  }
  if (!kind) return false;
  return allowed.includes(kind);
}

export function validateDeclaredContentType(contentType: string, filename: string): boolean {
  const ct = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const lower = filename.toLowerCase();
  if (ct === "application/pdf" && !lower.endsWith(".pdf")) return false;
  if (ct.startsWith("image/") && !/\.(png|jpe?g|webp|gif)$/i.test(lower)) return false;
  if (ct.includes("wordprocessingml") && !lower.endsWith(".docx")) return false;
  if (ct.includes("spreadsheetml") && !lower.endsWith(".xlsx")) return false;
  return true;
}

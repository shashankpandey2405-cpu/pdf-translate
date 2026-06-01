/** Shared helpers for tool file previews (before/after). */

export function formatPreviewBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function inferPreviewMime(blob: Blob, filename: string): string {
  if (blob.type && blob.type !== "application/octet-stream") return blob.type;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".rtf")) return "application/rtf";
  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lower.endsWith(".epub")) return "application/epub+zip";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".txt")) return "text/plain";
  return blob.type || "application/octet-stream";
}

export type FilePreviewSource = {
  label: string;
  blob: Blob;
  filename: string;
};

export function fileToPreviewSource(file: File, label: string): FilePreviewSource {
  return { label, blob: file, filename: file.name };
}

export function blobToPreviewSource(blob: Blob, filename: string, label: string): FilePreviewSource {
  return { label, blob, filename };
}

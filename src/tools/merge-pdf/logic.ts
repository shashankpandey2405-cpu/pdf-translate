import { mergePdfsInWorker } from "@/lib/trustShield/pdfWorkerPool";
import { imageFileToPdf } from "@/tools/universal-converter/imagesToPdf";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/")) return true;
  const n = file.name.toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp|tiff?|heic|heif|avif)$/i.test(n);
}

/** Accept string for merge dropzone (PDF + common photos). */
export const MERGE_ACCEPT =
  ".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/heic,image/heif,image/tiff,image/avif,image/*";

/** Normalize PDFs and images into PDF files for merging. */
export async function normalizeFilesForMerge(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    if (isPdfFile(file)) {
      out.push(file);
      continue;
    }
    if (isImageFile(file)) {
      const { bytes, filename } = await imageFileToPdf(file);
      out.push(new File([bytes as BlobPart], filename, { type: "application/pdf" }));
      continue;
    }
    throw new Error(
      `Unsupported file type: ${file.name}. Use PDF or images (PNG, JPG, WebP, HEIC, GIF, BMP, TIFF, AVIF).`,
    );
  }
  return out;
}

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const pdfs = await normalizeFilesForMerge(files);
  if (typeof window !== "undefined") {
    return mergePdfsInWorker(pdfs);
  }
  const { mergePdfBuffers } = await import("@/workers/tasks/merge");
  const buffers = await Promise.all(pdfs.map((f) => f.arrayBuffer()));
  return mergePdfBuffers(buffers);
}

export function getMergedFilename(files: File[]): string {
  return `merged_${files.length}_files.pdf`;
}

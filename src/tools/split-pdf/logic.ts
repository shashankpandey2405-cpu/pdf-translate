import { PDFDocument } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { splitPdfPagesInWorker, splitPdfSeparateInWorker } from "@/lib/trustShield/pdfWorkerPool";

const WORKER_SPLIT_THRESHOLD_BYTES = 5 * 1024 * 1024;
const WORKER_SPLIT_PAGE_THRESHOLD = 30;

function shouldUseWorkerSplit(file: File, pageCount: number): boolean {
  return file.size >= WORKER_SPLIT_THRESHOLD_BYTES || pageCount >= WORKER_SPLIT_PAGE_THRESHOLD;
}

export async function splitPDF(file: File, pageIndices: number[]): Promise<Uint8Array> {
  if (shouldUseWorkerSplit(file, pageIndices.length)) {
    const raw = await splitPdfPagesInWorker(file, pageIndices);
    const pdfDoc = await PDFDocument.load(raw, { ignoreEncryption: true });
    stampTrustShieldMetadata(pdfDoc);
    return pdfDoc.save();
  }

  return runStableBrowserJob(async () => {
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    stampTrustShieldMetadata(newPdf);
    return newPdf.save();
  });
}

/** Split into one PDF per page index. Prefer {@link splitPDFSeparateStreaming} for large jobs. */
export async function splitPDFIntoSeparateFiles(file: File, pageIndices: number[]): Promise<Uint8Array[]> {
  const collected: Uint8Array[] = [];
  await splitPDFSeparateStreaming(file, pageIndices, async (bytes) => {
    collected.push(bytes);
  });
  return collected;
}

/** Emit each single-page PDF without retaining the full array until the end. */
export async function splitPDFSeparateStreaming(
  file: File,
  pageIndices: number[],
  onPage: (bytes: Uint8Array, pageIndex: number) => void | Promise<void>,
): Promise<void> {
  if (shouldUseWorkerSplit(file, pageIndices.length)) {
    const outs = await splitPdfSeparateInWorker(file, pageIndices);
    for (let i = 0; i < outs.length; i++) await onPage(outs[i]!, pageIndices[i]!);
    return;
  }
  await runStableBrowserJob(async () => {
    const arrayBuffer = await file.arrayBuffer();
    const { splitPdfSeparateBuffers } = await import("@/workers/tasks/split");
    await splitPdfSeparateBuffers(arrayBuffer, pageIndices, async (bytes, i) => {
      await onPage(bytes, pageIndices[i]!);
    });
  });
}

export function getSplitFilename(original: string, pages: number[]): string {
  const base = original.replace(/\.pdf$/i, "");
  if (pages.length === 1) return `${base}_page_${pages[0] + 1}.pdf`;
  return `${base}_pages_${pages[0] + 1}-${pages[pages.length - 1] + 1}.pdf`;
}

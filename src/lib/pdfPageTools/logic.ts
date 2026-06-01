import { PDFDocument } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { splitPDF, getSplitFilename } from "@/tools/split-pdf/logic";
import { ConversionError } from "@/tools/conversions/ConversionError";

/** Extract selected pages into one PDF (same engine as Split PDF). */
export async function extractPdfPages(file: File, pageIndices: number[]): Promise<Uint8Array> {
  if (!pageIndices.length) {
    throw new ConversionError("EMPTY", "Select at least one page to extract.");
  }
  return splitPDF(file, pageIndices);
}

export function getExtractFilename(original: string, pages: number[]): string {
  return getSplitFilename(original, pages);
}

/** Remove selected pages; keeps all other pages in order. */
export async function removePdfPages(file: File, pageIndicesToRemove: number[]): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
    const removeSet = new Set(pageIndicesToRemove);
    if (removeSet.size < 1) {
      throw new ConversionError("EMPTY", "Select at least one page to remove.");
    }
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const total = src.getPageCount();
    const keep = src.getPageIndices().filter((i) => !removeSet.has(i));
    if (keep.length < 1) {
      throw new ConversionError("STRUCTURE", "You must keep at least one page in the document.");
    }
    if (keep.length === total) {
      throw new ConversionError("EMPTY", "Select pages to remove.");
    }
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, keep);
    copied.forEach((p) => out.addPage(p));
    stampTrustShieldMetadata(out);
    return out.save();
  });
}

export function getRemovePagesFilename(original: string, removedCount: number): string {
  const base = original.replace(/\.pdf$/i, "");
  return `${base}_removed_${removedCount}_pages.pdf`;
}

/** Reorder pages — `pageOrder` is original 0-based indices in desired output order. */
export async function organizePdfPages(file: File, pageOrder: number[]): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
    if (!pageOrder.length) {
      throw new ConversionError("EMPTY", "No pages to organize.");
    }
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const total = src.getPageCount();
    const out = await PDFDocument.create();
    for (const pageIndex of pageOrder) {
      if (pageIndex < 0 || pageIndex >= total) continue;
      const [copied] = await out.copyPages(src, [pageIndex]);
      out.addPage(copied);
    }
    if (out.getPageCount() < 1) {
      throw new ConversionError("STRUCTURE", "Could not build PDF from page order.");
    }
    stampTrustShieldMetadata(out);
    return out.save();
  });
}

export function getOrganizeFilename(original: string): string {
  const base = original.replace(/\.pdf$/i, "");
  return `${base}_organized.pdf`;
}

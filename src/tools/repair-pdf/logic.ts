import { PDFDocument } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { ConversionError } from "@/tools/conversions/ConversionError";
import type { RepairMode, RepairPassId, RepairPdfReport } from "./types";

export type { RepairMode, RepairPdfReport, RepairPassId } from "./types";

type PassResult = { bytes: Uint8Array; pageCount: number; pass: RepairPassId };

async function passPdfLib(buf: ArrayBuffer): Promise<PassResult | null> {
  try {
    const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    stampTrustShieldMetadata(pdfDoc);
    const bytes = await pdfDoc.save();
    if (!bytes.byteLength || pageCount < 1) return null;
    return { bytes, pageCount, pass: "pdf-lib" };
  } catch {
    return null;
  }
}

async function passMupdfRewrite(buf: ArrayBuffer): Promise<PassResult | null> {
  try {
    const mupdf = (await import("mupdf")) as typeof import("mupdf");
    const doc = mupdf.Document.openDocument(buf, "pdf") as InstanceType<typeof mupdf.PDFDocument>;
    try {
      const outBuf = doc.saveToBuffer();
      const bytes = outBuf.asUint8Array();
      if (!bytes.byteLength) return null;
      let pageCount = 1;
      try {
        const check = await PDFDocument.load(bytes, { ignoreEncryption: true });
        pageCount = check.getPageCount();
      } catch {
        pageCount = 1;
      }
      return { bytes, pageCount, pass: "mupdf-rewrite" };
    } finally {
      doc.destroy();
    }
  } catch {
    return null;
  }
}

/** Copy every page into a fresh document — fixes many broken xref / trailer issues. */
async function passPageRebuild(buf: ArrayBuffer): Promise<PassResult | null> {
  try {
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const indices = src.getPageIndices();
    if (!indices.length) return null;
    const dst = await PDFDocument.create();
    const copied = await dst.copyPages(src, indices);
    for (const page of copied) dst.addPage(page);
    stampTrustShieldMetadata(dst);
    const bytes = await dst.save();
    if (!bytes.byteLength) return null;
    return { bytes, pageCount: indices.length, pass: "page-rebuild" };
  } catch {
    return null;
  }
}

function pickBest(candidates: PassResult[]): PassResult | null {
  if (!candidates.length) return null;
  return candidates.reduce((best, cur) => {
    if (cur.pageCount > best.pageCount) return cur;
    if (cur.pageCount < best.pageCount) return best;
    return cur.bytes.byteLength >= best.bytes.byteLength ? cur : best;
  });
}

export async function repairPdf(
  file: File,
  mode: RepairMode = "quick",
): Promise<{ bytes: Uint8Array; report: RepairPdfReport }> {
  return runStableBrowserJob(async () => {
    const buf = await file.arrayBuffer();
    const originalSizeBytes = buf.byteLength;
    const passesAttempted: RepairPassId[] = [];
    const warnings: string[] = [];
    const results: PassResult[] = [];

    const tryPass = async (id: RepairPassId, fn: () => Promise<PassResult | null>) => {
      passesAttempted.push(id);
      const r = await fn();
      if (r) results.push(r);
      else warnings.push(`${id} did not produce a valid output.`);
    };

    await tryPass("pdf-lib", () => passPdfLib(buf));

    if (!results.length || mode === "deep") {
      await tryPass("mupdf-rewrite", () => passMupdfRewrite(buf));
    }

    if (mode === "deep" || !results.length) {
      await tryPass("page-rebuild", () => passPageRebuild(buf));
    }

    const best = pickBest(results);
    if (!best) {
      throw new ConversionError(
        "STRUCTURE",
        "Could not repair this PDF. The file may be severely corrupted or use an unsupported format.",
      );
    }

    if (best.pageCount < 1) {
      throw new ConversionError("STRUCTURE", "Repair produced a PDF with no pages.");
    }

    if (best.bytes.byteLength < 512) {
      warnings.push("Output is very small — verify pages open correctly.");
    }

    const report: RepairPdfReport = {
      success: true,
      mode,
      method: best.pass,
      passesAttempted,
      pageCount: best.pageCount,
      originalSizeBytes,
      outputSizeBytes: best.bytes.byteLength,
      warnings,
    };

    return { bytes: best.bytes, report };
  });
}

export function getRepairedFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + "_repaired.pdf";
}

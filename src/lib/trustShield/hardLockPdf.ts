import { PDFDocument } from "pdf-lib";
import {
  assertWithinBrowserPageCap,
  getAdaptiveExportScale,
  runStableBrowserJob,
  yieldToMain,
} from "@/lib/browserSafeProcessing";
import { getPdfEngine } from "@/pdf-engine/engineProvider";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { validatePdfBytes } from "@/lib/pdf/validatePdfStructure";
import { ConversionError } from "@/tools/conversions/ConversionError";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new ConversionError("STRUCTURE", "Invalid image data from page render.");
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Stamp metadata indicating immutable Hard Lock flattening. */
export function stampHardLockMetadata(pdfDoc: PDFDocument): void {
  stampTrustShieldMetadata(pdfDoc);
  pdfDoc.setSubject("PDFTrusted Hard Lock — permanently flattened, non-editable");
  pdfDoc.setKeywords([
    "PDFTrusted",
    "PDFTrusted Hard Lock",
    "Immutable PDF",
    "Flattened",
    "Non-editable",
  ]);
}

/**
 * Rasterize every page to a high-resolution PNG and rebuild a single-layer PDF.
 * Text, vectors, annotations, and signatures become non-selectable pixels.
 */
export async function hardLockPdfBytes(
  pdfBytes: Uint8Array,
  options?: { renderScale?: number; onProgress?: (page: number, total: number) => void },
): Promise<Uint8Array> {
  if (typeof document === "undefined") {
    throw new ConversionError("UNSUPPORTED", "Hard Lock requires a browser environment.");
  }

  return runStableBrowserJob(async () => {
    validatePdfBytes(pdfBytes);
    const file = new File([pdfBytes as BlobPart], "hard-lock-source.pdf", { type: "application/pdf" });
    const fileMb = pdfBytes.byteLength / (1024 * 1024);
    const engine = await getPdfEngine();
    const src = await engine.open(file);
    const outDoc = await PDFDocument.create();

    try {
      const total = src.getPageCount();
      assertWithinBrowserPageCap(total);
      const scale =
        options?.renderScale ?? getAdaptiveExportScale(total, fileMb);

      for (let pageNum = 1; pageNum <= total; pageNum += 1) {
        options?.onProgress?.(pageNum, total);
        const { width, height } = src.getPageSize(pageNum);
        const canvas = document.createElement("canvas");
        await src.renderPageToCanvas(canvas, {
          pageNumber: pageNum,
          scale,
          intent: "export",
          dprCap: 2,
        });

        const pngBytes = dataUrlToUint8Array(canvas.toDataURL("image/png"));
        const image = await outDoc.embedPng(pngBytes);
        const page = outDoc.addPage([width, height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
        if (pageNum % 4 === 0) await yieldToMain();
      }
    } finally {
      src.destroy();
    }

    if (outDoc.getPageCount() === 0) {
      throw new ConversionError("EMPTY", "Hard Lock produced an empty document.");
    }

    stampHardLockMetadata(outDoc);
    return outDoc.save();
  });
}

export async function hardLockPdfFile(
  file: File,
  options?: { renderScale?: number; onProgress?: (page: number, total: number) => void },
): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return hardLockPdfBytes(new Uint8Array(buf), options);
}

export function getHardLockedFilename(file: File | string): string {
  const name = typeof file === "string" ? file : file.name;
  return name.replace(/\.pdf$/i, "") + "_hard-locked.pdf";
}

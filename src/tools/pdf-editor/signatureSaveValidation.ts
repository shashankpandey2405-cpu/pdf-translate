import type { CanvasDim, ImageAnnotation } from "./logic";

const MIN_INK_ALPHA = 8;
const MIN_INK_RATIO = 0.002;

type StampCheck = {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

function canvasToPdfBbox(
  stamp: StampCheck,
  dim: CanvasDim,
): { x: number; y: number; w: number; h: number } {
  const sx = dim.pdfWidth / dim.width;
  const sy = dim.pdfHeight / dim.height;
  const x = stamp.x * sx;
  const w = stamp.w * sx;
  const h = stamp.h * sy;
  const y = dim.pdfHeight - (stamp.y + stamp.h) * sy;
  return { x, y, w, h };
}

async function sampleStampInk(
  pdfBytes: Uint8Array,
  stamp: StampCheck,
  dim: CanvasDim,
): Promise<{ inkPixels: number; totalPixels: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  const { configurePdfJsWorker } = await import("@/lib/configurePdfJsWorker");
  configurePdfJsWorker(pdfjsLib);

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  try {
    const page = await pdf.getPage(stamp.page + 1);
    const bbox = canvasToPdfBbox(stamp, dim);
    const scale = Math.min(2, Math.max(0.75, 120 / Math.max(bbox.w, bbox.h)));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(8, Math.ceil(bbox.w * scale));
    canvas.height = Math.max(8, Math.ceil(bbox.h * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { inkPixels: 0, totalPixels: 1 };

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
      transform: [scale, 0, 0, scale, -bbox.x * scale, -bbox.y * scale],
    }).promise;

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    let ink = 0;
    const total = canvas.width * canvas.height;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]!;
      if (a < MIN_INK_ALPHA) continue;
      const lum = 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;
      if (lum < 248) ink++;
    }
    return { inkPixels: ink, totalPixels: total };
  } finally {
    void pdf.destroy();
  }
}

/** Post-save check: each signature stamp region should contain visible ink. */
export async function validateSignedPdfStamps(
  pdfBytes: Uint8Array,
  stamps: ImageAnnotation[],
  dims: Record<number, CanvasDim>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (typeof document === "undefined") return { ok: true };
  if (stamps.length === 0) return { ok: false, message: "No signatures to export." };

  for (const stamp of stamps) {
    const dim = stamp.exportDim ?? dims[stamp.page];
    if (!dim) {
      return { ok: false, message: `Missing page dimensions for signature on page ${stamp.page + 1}.` };
    }
    const { inkPixels, totalPixels } = await sampleStampInk(pdfBytes, stamp, dim);
    const ratio = inkPixels / Math.max(1, totalPixels);
    if (inkPixels < 2 || ratio < MIN_INK_RATIO) {
      return {
        ok: false,
        message: `Signature on page ${stamp.page + 1} may not have saved correctly. Try repositioning and download again.`,
      };
    }
  }
  return { ok: true };
}

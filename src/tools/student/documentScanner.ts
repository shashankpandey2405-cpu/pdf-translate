/** Canvas utilities for document scanner — crop, filters, multi-page PDF export. */

import { enhanceScanCanvas } from "@/tools/ai-scanner/processScan";
import { imagesToPdf } from "@/tools/universal-converter/imagesToPdf";

export type ScanFilterMode = "color" | "enhance" | "grayscale" | "bw";

export type CropRect = { x: number; y: number; w: number; h: number };

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(source, 0, 0);
  return out;
}

export function loadImageToCanvas(file: File): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve({ canvas, ctx });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0);
    return canvas;
  } finally {
    bitmap.close();
  }
}

export function rotateCanvas90(
  source: HTMLCanvasElement,
  direction: "cw" | "ccw",
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.height;
  out.height = source.width;
  const ctx = out.getContext("2d")!;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(direction === "cw" ? Math.PI / 2 : -Math.PI / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return out;
}

/** Professional scan: grayscale + contrast + light threshold */
export function applyScanFilter(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = cloneCanvas(source);
  const ctx = out.getContext("2d")!;
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
    const v = boosted > 200 ? 255 : boosted < 85 ? 0 : boosted;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

export function applyGrayscaleFilter(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = cloneCanvas(source);
  const ctx = out.getContext("2d")!;
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    d[i] = d[i + 1] = d[i + 2] = gray;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

export async function applyFilterMode(source: HTMLCanvasElement, mode: ScanFilterMode): Promise<HTMLCanvasElement> {
  if (mode === "color") return cloneCanvas(source);
  if (mode === "bw") return applyScanFilter(source);
  if (mode === "grayscale") return applyGrayscaleFilter(source);
  const out = cloneCanvas(source);
  await enhanceScanCanvas(out);
  return out;
}

/** Crop normalized rect (0–1) from source canvas */
export function cropCanvas(source: HTMLCanvasElement, rect: CropRect): HTMLCanvasElement {
  const sx = Math.round(rect.x * source.width);
  const sy = Math.round(rect.y * source.height);
  const sw = Math.max(1, Math.round(rect.w * source.width));
  const sh = Math.max(1, Math.round(rect.h * source.height));
  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

export function renderPagePreview(
  source: HTMLCanvasElement,
  opts: { crop?: CropRect; cropEnabled?: boolean; filter: ScanFilterMode },
): Promise<HTMLCanvasElement> {
  let work = opts.cropEnabled && opts.crop ? cropCanvas(source, opts.crop) : cloneCanvas(source);
  return applyFilterMode(work, opts.filter);
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/jpeg", quality);
  });
}

export async function exportPagesAsPdf(
  canvases: HTMLCanvasElement[],
  filename = "scanned-document.pdf",
): Promise<{ bytes: Uint8Array; filename: string }> {
  const files = await Promise.all(
    canvases.map(async (c, i) => {
      const blob = await canvasToJpegBlob(c, 0.9);
      return new File([blob], `scan-page-${i + 1}.jpg`, { type: "image/jpeg" });
    }),
  );
  const bytes = await imagesToPdf(files);
  return { bytes, filename };
}

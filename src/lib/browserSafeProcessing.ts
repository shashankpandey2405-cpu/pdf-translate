/**
 * Shared guards for browser PDF work — chunked pages, adaptive render scale,
 * serialized worker queue, and device page caps (prevents tab OOM/crash).
 */
import { getDeviceCapability } from "@/lib/deviceCapability";
import { getDeviceBrowserLimits } from "@/lib/limits/deviceAdaptiveLimits";
import { enqueuePdfJob } from "@/lib/pdfJobQueue";
import { withSilentRecovery } from "@/lib/processingRecovery";
import { ConversionError } from "@/tools/conversions/ConversionError";

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** Pages processed per open/close cycle before yielding to the main thread. */
export function getPageProcessingChunkSize(): number {
  const { tier } = getDeviceCapability();
  if (tier === "low") return 6;
  if (tier === "high") return 24;
  return 12;
}

/** Export/render scale — lower on large docs so canvas memory stays bounded. */
export function getAdaptiveExportScale(pageCount: number, fileSizeMb: number): number {
  const { tier } = getDeviceCapability();
  let scale = tier === "low" ? 1.5 : tier === "high" ? 2.25 : 2;
  if (pageCount > 100) scale = Math.min(scale, 1.15);
  else if (pageCount > 60) scale = Math.min(scale, 1.35);
  else if (pageCount > 30) scale = Math.min(scale, 1.6);
  else if (pageCount > 15) scale = Math.min(scale, 1.85);
  if (fileSizeMb > 40) scale = Math.min(scale, 1.35);
  else if (fileSizeMb > 20) scale = Math.min(scale, 1.6);
  if (tier === "low") scale = Math.min(scale, 1.35);
  return Math.max(1, Math.round(scale * 100) / 100);
}

export function assertWithinBrowserPageCap(pageCount: number): void {
  if (!Number.isFinite(pageCount) || pageCount < 1) {
    throw new ConversionError("EMPTY", "No pages found in this PDF.");
  }
  const cap = getDeviceBrowserLimits().maxPages;
  if (pageCount > cap) {
    throw new ConversionError(
      "UNSUPPORTED",
      `This PDF has ${pageCount} pages — too many for stable browser processing on this device (max ${cap}). Sign in for Trusted Cloud (up to 60MB).`,
    );
  }
}

export async function getPdfPageCountForFile(file: File): Promise<number> {
  const { acquirePdfDocument, releasePdfDocument } = await import("@/lib/pdfjsClient");
  const pdf = await acquirePdfDocument(file);
  try {
    return pdf.numPages;
  } finally {
    releasePdfDocument(file);
  }
}

/** Run heavy browser PDF work on the serial queue with one silent retry. */
export async function runStableBrowserJob<T>(work: () => Promise<T>): Promise<T> {
  return withSilentRecovery(() => enqueuePdfJob(async () => work()), {
    maxAttempts: 2,
    baseDelayMs: 500,
  });
}

/** Clamp huge photos before canvas embed (merge / image→PDF). */
export function getMaxImageSidePx(): number {
  const { tier } = getDeviceCapability();
  if (tier === "low") return 4096;
  if (tier === "high") return 12_000;
  return 8192;
}

export async function scaleDownImageBitmap(bitmap: ImageBitmap): Promise<ImageBitmap> {
  const maxSide = getMaxImageSidePx();
  const w = bitmap.width;
  const h = bitmap.height;
  if (w <= maxSide && h <= maxSide) return bitmap;
  const scale = maxSide / Math.max(w, h);
  const tw = Math.max(1, Math.floor(w * scale));
  const th = Math.max(1, Math.floor(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) return bitmap;
  ctx.drawImage(bitmap, 0, 0, tw, th);
  bitmap.close();
  return createImageBitmap(canvas);
}

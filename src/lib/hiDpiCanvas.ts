import { getRenderDprCap } from "@/lib/render/canvasBudget";

export function getDevicePixelRatio() {
  if (typeof window === "undefined") return 1;
  return Math.max(1, Math.min(getRenderDprCap(), window.devicePixelRatio || 1));
}

/**
 * Configure a canvas for crisp high-DPI rendering.
 * - `cssWidth/cssHeight` are in CSS pixels.
 * - Internally allocates a larger backing store and scales the context.
 */
export function setupHiDPICanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number, dpr = getDevicePixelRatio()) {
  const w = Math.max(1, Math.floor(cssWidth));
  const h = Math.max(1, Math.floor(cssHeight));
  const scale = Math.max(1, dpr);

  // CSS size
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  // Backing store size
  canvas.width = Math.floor(w * scale);
  canvas.height = Math.floor(h * scale);

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  return { ctx, dpr: scale, cssWidth: w, cssHeight: h };
}


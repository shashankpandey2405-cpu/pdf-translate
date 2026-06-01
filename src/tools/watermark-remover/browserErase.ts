export type MaskRect = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getRectPixels(rect: MaskRect, width: number, height: number) {
  const x = Math.floor((clampPct(rect.xPct) / 100) * width);
  const y = Math.floor((clampPct(rect.yPct) / 100) * height);
  const w = Math.max(2, Math.floor((clampPct(rect.wPct) / 100) * width));
  const h = Math.max(2, Math.floor((clampPct(rect.hPct) / 100) * height));
  return { x, y, w, h };
}

/**
 * Lightweight browser-side erase for <=5MB files.
 * This is intentionally conservative: it uses regional blur/feathering instead of hallucinating pixels.
 */
export async function eraseWatermarkInBrowser(
  sourceDataUrl: string,
  mode: "auto" | "manual",
  rect: MaskRect,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Failed to load image for browser-side erase"));
    element.src = sourceDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize canvas context");

  ctx.drawImage(img, 0, 0);

  const targets =
    mode === "manual"
      ? [getRectPixels(rect, img.width, img.height)]
      : [
          // Auto mode uses conservative common watermark zones.
          { x: Math.floor(img.width * 0.62), y: Math.floor(img.height * 0.03), w: Math.floor(img.width * 0.34), h: Math.floor(img.height * 0.12) },
          { x: Math.floor(img.width * 0.58), y: Math.floor(img.height * 0.82), w: Math.floor(img.width * 0.38), h: Math.floor(img.height * 0.14) },
        ];

  for (const target of targets) {
    const { x, y, w, h } = target;
    if (w < 2 || h < 2) continue;

    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const sctx = snapshot.getContext("2d");
    if (!sctx) continue;
    sctx.drawImage(canvas, 0, 0);

    ctx.save();
    ctx.filter = "blur(12px) saturate(105%)";
    // Blend blurred source region back into target rectangle.
    ctx.drawImage(snapshot, x - 20, y - 20, w + 40, h + 40, x, y, w, h);
    ctx.restore();

    // Gentle luminance normalization to suppress semi-transparent text remnants.
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

export async function createMaskDataUrl(
  sourceDataUrl: string,
  rect: MaskRect,
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Failed to load source image"));
    element.src = sourceDataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize mask canvas");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const { x, y, w, h } = getRectPixels(rect, img.width, img.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);
  return canvas.toDataURL("image/png");
}

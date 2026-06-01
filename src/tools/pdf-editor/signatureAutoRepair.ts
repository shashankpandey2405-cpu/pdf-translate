/**
 * Auto-repair a signature PNG: smooth jagged edges, remove stray pixels,
 * and sharpen stroke contrast for a clean paper-like result.
 */
export async function autoRepairSignature(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;

  const img = await loadImage(dataUrl);
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w < 4 || h < 4) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  removeStrayPixels(d, w, h);
  contrastBoost(d);

  ctx.putImageData(imageData, 0, 0);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d");
  if (!outCtx) return canvas.toDataURL("image/png");

  outCtx.filter = "blur(0.35px)";
  outCtx.drawImage(canvas, 0, 0);

  return out.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Remove isolated pixels (ink specks) that have fewer than 2 opaque neighbors. */
function removeStrayPixels(data: Uint8ClampedArray, w: number, h: number) {
  const isOpaque = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    return data[(y * w + x) * 4 + 3]! > 40;
  };

  const toRemove: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3]! <= 40) continue;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (isOpaque(x + dx, y + dy)) neighbors++;
        }
      }
      if (neighbors < 2) toRemove.push(idx);
    }
  }
  for (const idx of toRemove) {
    data[idx + 3] = 0;
  }
}

/** Boost ink contrast: darken semi-transparent strokes, clean light fringes. */
function contrastBoost(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!;
    if (a === 0) continue;
    if (a < 30) {
      data[i + 3] = 0;
      continue;
    }
    if (a < 200) {
      data[i + 3] = Math.min(255, Math.round(a * 1.6));
    }
  }
}

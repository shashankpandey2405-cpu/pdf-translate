/**
 * Trim transparent/white margins from a canvas (replacement for broken trim-canvas CJS interop in Next.js).
 */
export function trimCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  const width = source.width;
  const height = source.height;
  if (width < 1 || height < 1) return source;

  const data = ctx.getImageData(0, 0, width, height).data;

  const rowHasInk = (fromTop: boolean) => {
    const step = fromTop ? 1 : -1;
    const start = fromTop ? 0 : height - 1;
    const end = fromTop ? height : -1;
    for (let y = start; y !== end; y += step) {
      for (let x = 0; x < width; x++) {
        if (data[4 * (y * width + x) + 3]! > 0) return y;
      }
    }
    return fromTop ? 0 : height - 1;
  };

  const colHasInk = (fromLeft: boolean) => {
    const step = fromLeft ? 1 : -1;
    const start = fromLeft ? 0 : width - 1;
    const end = fromLeft ? width : -1;
    for (let x = start; x !== end; x += step) {
      for (let y = 0; y < height; y++) {
        if (data[4 * (y * width + x) + 3]! > 0) return x;
      }
    }
    return fromLeft ? 0 : width - 1;
  };

  const top = rowHasInk(true);
  const bottom = rowHasInk(false);
  const left = colHasInk(true);
  const right = colHasInk(false);

  const cropW = Math.max(1, right - left + 1);
  const cropH = Math.max(1, bottom - top + 1);

  if (cropW === width && cropH === height) return source;

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, left, top, cropW, cropH, 0, 0, cropW, cropH);
  return out;
}

export default trimCanvas;

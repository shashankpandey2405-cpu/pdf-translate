import type { CanvasDim } from "@/tools/pdf-editor/logic";

function drawFileToCanvas(file: File, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read signature image."));
    };
    img.src = url;
  });
}

async function loadFilePixels(file: File): Promise<ImageData> {
  if (typeof document === "undefined") {
    throw new Error("signatureRemoveLightBackground requires a browser environment");
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not available");

  try {
    const bitmap = await createImageBitmap(file);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
  } catch {
    await drawFileToCanvas(file, canvas, ctx);
  }

  if (canvas.width < 1 || canvas.height < 1) {
    throw new Error("Image has no readable dimensions.");
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** True when enough opaque pixels remain after background removal. */
export function dataUrlHasSignatureInk(dataUrl: string, minOpaquePixels = 48): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(true);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return Promise.resolve(true);
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.naturalWidth || 1;
      canvas.height = img.naturalHeight || 1;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let opaque = 0;
      for (let i = 3; i < d.length; i += 4) {
        if (d[i]! > 40) {
          opaque++;
          if (opaque >= minOpaquePixels) {
            resolve(true);
            return;
          }
        }
      }
      resolve(false);
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

/** Rough background removal for light paper / white backgrounds → transparent PNG base64 */
export async function signatureRemoveLightBackground(file: File, opts?: { whiteCutoff?: number }): Promise<string> {
  const cutoff = opts?.whiteCutoff ?? 240;
  const img = await loadFilePixels(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luminance >= cutoff || (r > 220 && g > 220 && b > 220)) {
      d[i + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Load any common photo format and return a signature-ready transparent PNG data URL. */
export async function fileToSignaturePngDataUrl(file: File, opts?: { whiteCutoff?: number }): Promise<string> {
  const raw = await signatureRemoveLightBackground(file, opts);
  const hasInk = await dataUrlHasSignatureInk(raw);
  if (!hasInk) {
    throw new Error(
      "No signature detected in this image. Use a darker signature on light paper, or try Draw/Type instead.",
    );
  }
  return raw;
}

/** Upscale a PNG/JPEG data URL for crisp pdf-lib embedding at placement size. */
export function upscaleDataUrlPng(dataUrl: string, scale = 3): Promise<string> {
  if (typeof document === "undefined" || scale <= 1) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      const out = document.createElement("canvas");
      out.width = Math.max(1, Math.round(w * scale));
      out.height = Math.max(1, Math.round(h * scale));
      const ctx = out.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, out.width, out.height);
      resolve(out.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Could not read signature image."));
    img.src = dataUrl;
  });
}

/** Placement size on the PDF canvas from a signature PNG/JPEG data URL. */
export function measureSignaturePlacement(
  dataUrl: string,
  maxWidth = 240,
  maxHeight = 120,
): Promise<{ w: number; h: number }> {
  if (typeof Image === "undefined") {
    return Promise.resolve({ w: maxWidth, h: maxHeight });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      let w = maxWidth;
      let h = (ih / iw) * maxWidth;
      if (h > maxHeight) {
        h = maxHeight;
        w = (iw / ih) * maxHeight;
      }
      resolve({ w: Math.max(48, Math.round(w)), h: Math.max(24, Math.round(h)) });
    };
    img.onerror = () => reject(new Error("Could not read signature image."));
    img.src = dataUrl;
  });
}

/** Wait until PDF page dimensions are known (canvas rendered). */
export async function waitForEditorPageDim(
  readDim: () => CanvasDim | null | undefined,
  maxMs = 20_000,
): Promise<CanvasDim | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const dim = readDim();
    if (dim && dim.width > 0 && dim.height > 0) return dim;
    await new Promise((r) => window.setTimeout(r, 120));
  }
  return readDim() ?? null;
}

/** Render typed signature at 3× native resolution for sharp PDF stamps. */
export function typeSignatureToPngPreview(text: string, fontCss: string, scale = 3): string {
  if (typeof document === "undefined") return "";
  const baseW = 640;
  const baseH = 180;
  const c = document.createElement("canvas");
  c.width = baseW * scale;
  c.height = baseH * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, baseW, baseH);
  ctx.font = `56px ${fontCss}`;
  ctx.fillStyle = "#0a1628";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text || "Signature", baseW / 2, baseH / 2);
  return c.toDataURL("image/png");
}

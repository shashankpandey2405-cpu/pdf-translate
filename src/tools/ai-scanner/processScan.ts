/** Browser document scan: OpenCV.js perspective + Canvas auto-enhance fallbacks. */

import { logDriverHealth } from "@/utils/logger";

export type ScanPipelineOptions = {
  perspective: boolean;
  enhance: boolean;
  portrait: boolean;
};

const CAPTURE_MAX_SIDE = 1600;

function clamp(v: number, a = 0, b = 255) {
  return Math.max(a, Math.min(b, Math.round(v)));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Order quad corners as TL, TR, BR, BL for warpPerspective destination mapping. */
function sortCornersQuad(pts: { x: number; y: number }[]) {
  const s = [...pts].sort((a, b) => a.y - b.y);
  const top = s.slice(0, 2).sort((a, b) => a.x - b.x);
  const bot = s.slice(2).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bot[1], bot[0]];
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png", 0.92);
  });
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function rafTick(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function rotateCanvas90CW(src: HTMLCanvasElement): HTMLCanvasElement {
  const dst = document.createElement("canvas");
  dst.width = src.height;
  dst.height = src.width;
  const c = dst.getContext("2d")!;
  c.translate(dst.width, 0);
  c.rotate(Math.PI / 2);
  c.drawImage(src, 0, 0);
  return dst;
}

/** Histogram-friendly brighten/contrast + light sharpen (Canvas). */
export async function enhanceScanCanvas(canvas: HTMLCanvasElement, signal?: AbortSignal) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const contrast = 1.14;
  const bright = 6;

  for (let y = 0; y < h; y++) {
    const rowIndex = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = rowIndex + x * 4;
      d[i] = clamp((d[i] - 128) * contrast + 128 + bright);
      d[i + 1] = clamp((d[i + 1] - 128) * contrast + 128 + bright);
      d[i + 2] = clamp((d[i + 2] - 128) * contrast + 128 + bright);
    }
    if (y % 8 === 0) {
      throwIfAborted(signal);
      await rafTick();
    }
  }

  const orig = new Uint8ClampedArray(d);
  const out = new Uint8ClampedArray(d.length);
  out.set(orig);
  const idx = (x: number, y: number) => (y * w + x) * 4;
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ];
  const mix = 0.35;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            acc += orig[idx(x + kx, y + ky) + c] * kernel[ky + 1][kx + 1];
          }
        }
        const base = orig[idx(x, y) + c];
        const sharpened = clamp(acc);
        out[idx(x, y) + c] = clamp(base * (1 - mix) + sharpened * mix);
      }
    }
    if (y % 8 === 0) {
      throwIfAborted(signal);
      await rafTick();
    }
  }

  img.data.set(out);
  ctx.putImageData(img, 0, 0);
}

async function ensureCv(): Promise<any> {
  const { loadOpenCv } = await import("@/lib/lazy/opencv");
  const cvMod = await loadOpenCv();
  const cv: any = (cvMod as { default?: unknown }).default ?? cvMod;
  if (cv instanceof Promise) return await cv;
  await new Promise<void>((resolve) => {
    if (cv.calledRun) resolve();
    else cv.onRuntimeInitialized = () => resolve();
  });
  return cv;
}

function extractApproxPoints(approx: any): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < approx.rows; i++) {
    if (typeof approx.intPtr === "function") {
      const p = approx.intPtr(i, 0);
      pts.push({ x: p[0], y: p[1] });
    } else if (approx.data32S && approx.data32S.length >= (i + 1) * 2) {
      pts.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] });
    } else {
      break;
    }
  }
  return pts;
}

async function tryPerspectiveWarp(colorCanvas: HTMLCanvasElement, signal?: AbortSignal): Promise<HTMLCanvasElement | null> {
  throwIfAborted(signal);
  const cv = await ensureCv();
  const colorSrc = cv.imread(colorCanvas);
  const gray = new cv.Mat();
  cv.cvtColor(colorSrc, gray, cv.COLOR_RGBA2GRAY);
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
  const edges = new cv.Mat();
  cv.Canny(blur, edges, 75, 200);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  let bestApprox: any = null;
  let bestArea = 0;
  const minArea = colorSrc.cols * colorSrc.rows * 0.1;

  try {
    for (let i = 0; i < contours.size(); i++) {
      throwIfAborted(signal);
      const cnt = contours.get(i);
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
      const area = cv.contourArea(approx, false);
      if (approx.rows === 4 && area > minArea && area > bestArea) {
        if (bestApprox) bestApprox.delete();
        bestApprox = approx;
        bestArea = area;
      } else {
        approx.delete();
      }
      cnt.delete();
    }
  } finally {
    contours.delete();
    hierarchy.delete();
    edges.delete();
    blur.delete();
    gray.delete();
  }

  if (!bestApprox) {
    colorSrc.delete();
    return null;
  }

  const rawPts = extractApproxPoints(bestApprox);
  bestApprox.delete();
  if (rawPts.length !== 4) {
    colorSrc.delete();
    return null;
  }

  const [tl, tr, br, bl] = sortCornersQuad(rawPts);
  const maxW = Math.max(dist(br, bl), dist(tr, tl));
  const maxH = Math.max(dist(tr, br), dist(tl, bl));
  const outW = Math.max(32, Math.round(maxW));
  const outH = Math.max(32, Math.round(maxH));

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, outW - 1, 0, outW - 1, outH - 1, 0, outH - 1]);
  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  const dst = new cv.Mat();
  const dsize = new cv.Size(outW, outH);
  cv.warpPerspective(colorSrc, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));

  srcTri.delete();
  dstTri.delete();
  M.delete();
  colorSrc.delete();

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  cv.imshow(outCanvas, dst);
  dst.delete();
  return outCanvas;
}

function prepareSourceCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  let { width: w, height: h } = bitmap;
  const maxSide = Math.max(w, h);
  if (maxSide > CAPTURE_MAX_SIDE) {
    const r = CAPTURE_MAX_SIDE / maxSide;
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

export async function scanImageFile(file: File, opts: ScanPipelineOptions, signal?: AbortSignal): Promise<Blob> {
  throwIfAborted(signal);
  const bitmap = await createImageBitmap(file);
  try {
    let work = prepareSourceCanvas(bitmap);
    if (opts.perspective) {
      try {
        const warped = await tryPerspectiveWarp(work, signal);
        if (warped) work = warped;
      } catch (e) {
        void logDriverHealth({
          tool_slug: "tools/ai-scanner",
          library: "opencv_js",
          phase: "perspective_warp",
          ok: false,
          error: e,
        });
        /* keep capped source */
      }
    }
    if (opts.portrait && work.width > work.height * 1.05) {
      work = rotateCanvas90CW(work);
    }
    if (opts.enhance) {
      await enhanceScanCanvas(work, signal);
    }
    return await canvasToPngBlob(work);
  } finally {
    bitmap.close();
  }
}

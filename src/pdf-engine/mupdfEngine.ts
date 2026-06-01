import type { PdfDocumentHandle, PdfEngine, PdfEngineName, PdfPageSize, RenderOptions } from "@/pdf-engine/types";
import { getDevicePixelRatio, setupHiDPICanvas } from "@/lib/hiDpiCanvas";

type MuPdfModule = typeof import("mupdf");

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function toRgbaPixels(pixels: Uint8ClampedArray, w: number, h: number, comps: number, hasAlpha: boolean) {
  if ((hasAlpha && comps === 4) || comps === 4) return pixels;
  if (comps === 3) {
    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
      out[j] = pixels[i];
      out[j + 1] = pixels[i + 1];
      out[j + 2] = pixels[i + 2];
      out[j + 3] = 255;
    }
    return out;
  }
  // Fallback: best-effort
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = 255;
  }
  return out;
}

export class MuPdfEngine implements PdfEngine {
  readonly name: PdfEngineName = "mupdf";
  private mupdf: MuPdfModule | null = null;

  async init() {
    if (this.mupdf) return;
    // MuPDF.js loads WASM lazily on first use; keep it route-split.
    this.mupdf = (await import("mupdf")) as unknown as MuPdfModule;
  }

  async open(file: File): Promise<PdfDocumentHandle> {
    await this.init();
    const m = this.mupdf!;
    const buf = await file.arrayBuffer();
    const doc = m.Document.openDocument(buf, "pdf");
    const id = `mupdf:${fileKey(file)}`;

    const pageCount = doc.countPages();

    return {
      engine: "mupdf",
      id,
      getPageCount: () => pageCount,
      getPageSize: (pageNumber: number): PdfPageSize => {
        const page = doc.loadPage(pageNumber - 1);
        try {
          const bounds = page.getBounds();
          return { width: bounds[2] - bounds[0], height: bounds[3] - bounds[1] };
        } finally {
          page.destroy();
        }
      },
      renderPageToCanvas: async (canvas: HTMLCanvasElement, opts: RenderOptions) => {
        const dpr = Math.min(getDevicePixelRatio(), opts.dprCap ?? 3);
        const page = doc.loadPage(opts.pageNumber - 1);
        const bounds = page.getBounds();
        const baseW = bounds[2] - bounds[0];
        const baseH = bounds[3] - bounds[1];
        const cssW = baseW * opts.scale;
        const cssH = baseH * opts.scale;

        const { ctx } = setupHiDPICanvas(canvas, cssW, cssH, dpr);
        if (!ctx) return;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cssW, cssH);

        // MuPDF renders in device pixels; we render at (scale*dpr) and then paint 1:1 into backing store.
        const renderScale = opts.scale * dpr;
        const matrix = m.Matrix.scale(renderScale, renderScale);
        const pixmap = page.toPixmap(matrix, m.ColorSpace.DeviceRGB, true);
        const w = pixmap.getWidth();
        const h = pixmap.getHeight();
        const pixels = pixmap.getPixels();
        const comps = pixmap.getNumberOfComponents();
        const hasAlpha = pixmap.getAlpha() === 1;
        const rgba = toRgbaPixels(pixels, w, h, comps, hasAlpha);
        // MuPDF typings use ArrayBufferLike; ImageData expects ArrayBuffer-backed arrays in TS DOM libs.
        const copy = new Uint8ClampedArray(rgba.length);
        copy.set(rgba);
        const img = new ImageData(copy, w, h);
        // Draw directly into backing store pixels; our ctx is scaled to CSS pixels, so temporarily reset.
        const raw = canvas.getContext("2d");
        if (!raw) return;
        raw.setTransform(1, 0, 0, 1, 0, 0);
        raw.putImageData(img, 0, 0);
        // Restore transform for any future callers.
        raw.setTransform(dpr, 0, 0, dpr, 0, 0);

        pixmap.destroy();
        page.destroy();
      },
      destroy: () => {
        doc.destroy();
      },
    };
  }
}


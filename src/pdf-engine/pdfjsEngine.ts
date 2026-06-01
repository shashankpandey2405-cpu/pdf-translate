import type { PdfDocumentHandle, PdfEngine, PdfEngineName, PdfPageSize, RenderOptions } from "@/pdf-engine/types";
import { getDevicePixelRatio, setupHiDPICanvas } from "@/lib/hiDpiCanvas";
import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";
import { readPdfFileBytes } from "@/lib/pdf/validatePdfStructure";
import { ConversionError } from "@/tools/conversions/ConversionError";

type PdfJsModule = typeof import("pdfjs-dist");

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export class PdfJsEngine implements PdfEngine {
  readonly name: PdfEngineName = "pdfjs";
  private pdfjs: PdfJsModule | null = null;

  async init() {
    if (typeof window === "undefined") {
      throw new ConversionError("UNSUPPORTED", "PDF rendering requires a browser environment.");
    }
    if (!this.pdfjs) this.pdfjs = await import("pdfjs-dist");
    configurePdfJsWorker(this.pdfjs);
  }

  async open(file: File): Promise<PdfDocumentHandle> {
    const bytes = await readPdfFileBytes(file);
    await this.init();
    const lib = this.pdfjs!;
    let doc: import("pdfjs-dist").PDFDocumentProxy;
    try {
      const task = lib.getDocument({ data: bytes, stopAtErrors: false });
      doc = await task.promise;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid PDF structure.";
      if (/password|encrypt/i.test(msg)) {
        throw new ConversionError("ENCRYPTED", "This PDF is password-protected. Unlock it first, then try again.");
      }
      throw new ConversionError("STRUCTURE", `Invalid PDF structure — ${msg}`);
    }
    const pageSizeCache = new Map<number, PdfPageSize>();
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      pageSizeCache.set(i, { width: viewport.width, height: viewport.height });
    }

    const id = `pdfjs:${fileKey(file)}`;

    return {
      engine: "pdfjs",
      id,
      getPageCount: () => doc.numPages,
      getPageSize: (pageNumber: number): PdfPageSize => {
        return pageSizeCache.get(pageNumber) ?? pageSizeCache.get(1) ?? { width: 1, height: 1 };
      },
      renderPageToCanvas: async (canvas: HTMLCanvasElement, opts: RenderOptions) => {
        const dpr = Math.min(getDevicePixelRatio(), opts.dprCap ?? 3);
        const page = await doc.getPage(opts.pageNumber);
        const viewport = page.getViewport({ scale: opts.scale });
        const { ctx } = setupHiDPICanvas(canvas, viewport.width, viewport.height, dpr);
        if (!ctx) return;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        await page.render({
          canvasContext: ctx as unknown as CanvasRenderingContext2D,
          viewport,
          canvas,
        }).promise;
      },
      destroy: () => {
        void doc.destroy();
      },
    };
  }
}


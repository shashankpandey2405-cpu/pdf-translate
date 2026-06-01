export type PdfEngineName = "mupdf" | "pdfjs";

export type PdfPageSize = { width: number; height: number };

export type RenderIntent = "screen" | "thumbnail" | "export";

export type RenderOptions = {
  /** Page number, 1-indexed */
  pageNumber: number;
  /** Scale in CSS pixels (not DPR). */
  scale: number;
  /** Optional hint for engine (quality/perf tradeoffs). */
  intent?: RenderIntent;
  /** If set, cap devicePixelRatio used for backing store. */
  dprCap?: number;
};

export interface PdfDocumentHandle {
  readonly engine: PdfEngineName;
  readonly id: string;
  getPageCount(): number;
  getPageSize(pageNumber: number): PdfPageSize;
  /**
   * Render into the given canvas. Implementations must produce crisp output
   * on high-DPI screens by using a larger backing store and drawing in CSS pixels.
   */
  renderPageToCanvas(canvas: HTMLCanvasElement, opts: RenderOptions): Promise<void>;
  destroy(): void;
}

export interface PdfEngine {
  readonly name: PdfEngineName;
  /** Lazy init the underlying worker/wasm runtime. */
  init(): Promise<void>;
  open(file: File): Promise<PdfDocumentHandle>;
}


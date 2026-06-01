import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjs: PdfJsModule | null = null;

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

type CachedDoc = {
  key: string;
  promise: Promise<PDFDocumentProxy>;
  doc: PDFDocumentProxy | null;
  lastUsedAt: number;
};

/** Keep memory bounded on large sessions (thumbnails + editor + tools). */
const MAX_CACHED_DOCS = 3;
const DOC_CACHE = new Map<string, CachedDoc>();

async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfjs) {
    const { loadPdfJs } = await import("@/lib/lazy/pdfjs");
    pdfjs = await loadPdfJs();
  }
  return pdfjs;
}

async function loadDoc(file: File): Promise<PDFDocumentProxy> {
  const lib = await getPdfJs();
  const buf = await file.arrayBuffer();
  const task = lib.getDocument({ data: new Uint8Array(buf) });
  return task.promise;
}

function evictOneIfNeeded() {
  if (DOC_CACHE.size < MAX_CACHED_DOCS) return;
  let oldestKey: string | null = null;
  let oldestTs = Infinity;
  for (const [k, v] of DOC_CACHE.entries()) {
    if (v.lastUsedAt < oldestTs) {
      oldestTs = v.lastUsedAt;
      oldestKey = k;
    }
  }
  if (!oldestKey) return;
  const victim = DOC_CACHE.get(oldestKey);
  DOC_CACHE.delete(oldestKey);
  void victim?.doc?.destroy?.();
}

/**
 * Load a PDF document with a small bounded in-memory cache (LRU).
 * - Avoids repeatedly decoding the same PDF on re-renders.
 * - Does not require paired `release` calls for normal reads.
 * - Use `releasePdfDocument()` when you intentionally drop a heavy workspace file.
 */
export async function acquirePdfDocument(file: File): Promise<PDFDocumentProxy> {
  const key = fileKey(file);
  const existing = DOC_CACHE.get(key);
  if (existing) {
    existing.lastUsedAt = Date.now();
    return existing.doc ? existing.doc : existing.promise;
  }

  evictOneIfNeeded();

  const entry: CachedDoc = {
    key,
    doc: null,
    lastUsedAt: Date.now(),
    promise: Promise.resolve()
      .then(() => loadDoc(file))
      .then((doc) => {
        entry.doc = doc;
        return doc;
      }),
  };
  DOC_CACHE.set(key, entry);
  return entry.promise;
}

export function releasePdfDocument(file: File) {
  const key = fileKey(file);
  const entry = DOC_CACHE.get(key);
  if (!entry) return;
  DOC_CACHE.delete(key);
  void entry.doc?.destroy?.();
}

export async function getPdfPage(file: File, pageNumber1: number): Promise<PDFPageProxy> {
  const doc = await acquirePdfDocument(file);
  return doc.getPage(pageNumber1);
}

export function cancelRenderTask(task: RenderTask | null | undefined) {
  try {
    task?.cancel();
  } catch {
    // ignore
  }
}

export function purgeUnusedPdfDocs(maxAgeMs = 2 * 60_000) {
  const now = Date.now();
  for (const [key, entry] of DOC_CACHE.entries()) {
    if (now - entry.lastUsedAt < maxAgeMs) continue;
    DOC_CACHE.delete(key);
    void entry.doc?.destroy?.();
  }
}

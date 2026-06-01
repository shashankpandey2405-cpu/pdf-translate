/** Lazy MuPDF WASM — repair fallback and optional render engine. */
let mupdfPromise: Promise<typeof import("mupdf")> | null = null;

export async function loadMupdf() {
  if (!mupdfPromise) {
    mupdfPromise = import("mupdf");
  }
  return mupdfPromise;
}

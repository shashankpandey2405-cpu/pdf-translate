let configured = false;

/**
 * Serve the worker from `public/pdf.worker.min.mjs` (copied by `scripts/copy-pdf-worker.mjs` at build).
 * Vite used `?url` imports; Next/webpack handles workers differently.
 */
export function configurePdfJsWorker(lib: { GlobalWorkerOptions: { workerSrc: string } }): void {
  if (configured) return;
  const base =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  lib.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;
  configured = true;
}

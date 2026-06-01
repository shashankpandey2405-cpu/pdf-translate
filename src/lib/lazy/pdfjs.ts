/** Lazy pdf.js — loaded only when a tool needs rendering or text extraction. */
import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      configurePdfJsWorker(mod);
      return mod;
    });
  }
  return pdfjsPromise;
}

export type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

import type { Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: () => {},
      });
      return worker;
    })();
  }
  return workerPromise;
}

export type OcrProgress = { status: string; progress: number };

/** Extract plain text from a camera photo or image upload. */
export async function extractTextFromImage(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const worker = await getWorker();
  // Tesseract v7 exposes progress via the worker-level logger, not per-call options.
  // Keep the callback for future enhancement without breaking the API.
  void onProgress;
  const result = await worker.recognize(file);
  const text = result.data.text?.trim() ?? "";
  if (text.length < 8) {
    throw new Error("Could not read enough text from this image. Try a clearer photo with good lighting.");
  }
  return text;
}

export function isImageFile(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  const n = file.name.toLowerCase();
  return /\.(jpe?g|png|webp|heic|heif|gif)$/.test(n);
}

export function isPdfFile(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  return t === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

import { ConversionError } from "@/tools/conversions/ConversionError";

/** @deprecated Browser OCR removed — cloud workers only. */
export type OcrOutputMode = "searchable-pdf" | "txt";

export type OcrProgress = (page: number, total: number, message: string) => void;

const CLOUD_ONLY_MESSAGE =
  "OCR runs only in cloud processing. Sign in and use cloud mode — browser OCR is not available.";

/** Browser OCR is disabled. All OCR must use the cloud pipeline. */
export async function ocrPdf(
  _file: File,
  _mode: OcrOutputMode = "searchable-pdf",
  _onProgress?: OcrProgress,
  _opts?: { maxPages?: number },
): Promise<{ bytes: Uint8Array; mime: string; filename: string }> {
  throw new ConversionError("UNSUPPORTED", CLOUD_ONLY_MESSAGE);
}

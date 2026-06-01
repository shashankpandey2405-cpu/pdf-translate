import { PDFDocument } from "pdf-lib";

export type LoadedPdfForEditing =
  | { mode: "vector"; doc: PDFDocument }
  | { mode: "raster"; doc: null };

export async function loadPdfForEditing(
  bytes: Uint8Array,
  _maxPages: number,
): Promise<LoadedPdfForEditing> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return { mode: "vector", doc };
  } catch {
    return { mode: "raster", doc: null };
  }
}

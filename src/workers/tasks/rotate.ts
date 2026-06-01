import { PDFDocument, degrees } from "pdf-lib";

export type RotationAngle = 90 | 180 | 270;

export interface PageRotation {
  pageIndex: number;
  angle: RotationAngle;
}

export async function rotatePagesBuffer(
  buffer: ArrayBuffer,
  rotations: PageRotation[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  for (const { pageIndex, angle } of rotations) {
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return pdfDoc.save();
}

export async function rotateAllPagesBuffer(
  buffer: ArrayBuffer,
  angle: RotationAngle,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  for (const page of pdfDoc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return pdfDoc.save();
}

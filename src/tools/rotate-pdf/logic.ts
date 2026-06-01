import { PDFDocument, degrees } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import { rotateAllPagesInWorker, rotatePagesInWorker } from "@/lib/trustShield/pdfWorkerPool";

export type RotationAngle = 90 | 180 | 270;

export interface PageRotation {
  pageIndex: number;
  angle: RotationAngle;
}

const WORKER_ROTATE_THRESHOLD_BYTES = 5 * 1024 * 1024;

function shouldUseWorkerRotate(file: File, rotationCount: number): boolean {
  return file.size >= WORKER_ROTATE_THRESHOLD_BYTES || rotationCount >= 8;
}

export async function rotatePDF(file: File, rotations: PageRotation[]): Promise<Uint8Array> {
  if (shouldUseWorkerRotate(file, rotations.length)) {
    const raw = await rotatePagesInWorker(file, rotations);
    const pdfDoc = await PDFDocument.load(raw, { ignoreEncryption: true });
    stampTrustShieldMetadata(pdfDoc);
    return pdfDoc.save();
  }

  return runStableBrowserJob(async () => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    for (const { pageIndex, angle } of rotations) {
      if (pageIndex < 0 || pageIndex >= pages.length) continue;
      const page = pages[pageIndex];
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    }

    stampTrustShieldMetadata(pdfDoc);
    return pdfDoc.save();
  });
}

export async function rotateAllPages(file: File, angle: RotationAngle): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
    const rotated = await rotateAllPagesInWorker(file, angle);
    const pdfDoc = await PDFDocument.load(rotated, { ignoreEncryption: true });
    stampTrustShieldMetadata(pdfDoc);
    return pdfDoc.save();
  });
}

export function getRotatedFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + "_rotated.pdf";
}

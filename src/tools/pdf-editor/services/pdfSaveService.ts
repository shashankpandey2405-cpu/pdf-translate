import { PDFDocument, rgb, StandardFonts, LineCapStyle } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";
import type { Annotation, CanvasDim } from "../types";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

/**
 * Save annotations to PDF.
 */
export async function saveAnnotationsToPDF(
  file: File,
  annotations: Annotation[],
  dims: Record<number, CanvasDim>
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const ann of annotations) {
    const page = pages[ann.page];
    if (!page) continue;
    const dim = dims[ann.page];
    if (!dim) continue;

    const sx = dim.pdfWidth / dim.width;
    const sy = dim.pdfHeight / dim.height;
    const flipY = (cy: number) => dim.pdfHeight - cy * sy;

    if (ann.type === "text") {
      const [r, g, b] = hexToRgb(ann.color);
      page.drawText(ann.text || " ", {
        x: ann.x * sx,
        y: flipY(ann.y) - ann.size * 0.75,
        size: ann.size * sy,
        font,
        color: rgb(r, g, b),
      });
    } else if (ann.type === "pen") {
      if (ann.points.length < 2) continue;
      const [r, g, b] = hexToRgb(ann.color);
      for (let i = 1; i < ann.points.length; i++) {
        const p0 = ann.points[i - 1];
        const p1 = ann.points[i];
        page.drawLine({
          start: { x: p0.x * sx, y: flipY(p0.y) },
          end: { x: p1.x * sx, y: flipY(p1.y) },
          thickness: ann.width * Math.min(sx, sy),
          color: rgb(r, g, b),
          lineCap: LineCapStyle.Round,
        });
      }
    } else if (ann.type === "highlight") {
      const x = Math.min(ann.x, ann.x + ann.w) * sx;
      const w = Math.abs(ann.w) * sx;
      const rawY = Math.min(ann.y, ann.y + ann.h);
      const h = Math.abs(ann.h) * sy;
      page.drawRectangle({
        x,
        y: flipY(rawY + Math.abs(ann.h)),
        width: w,
        height: h,
        color: rgb(1, 0.95, 0),
        opacity: 0.35,
      });
    } else if (ann.type === "rect") {
      const [r, g, b] = hexToRgb(ann.color);
      const x = Math.min(ann.x, ann.x + ann.w) * sx;
      const w = Math.abs(ann.w) * sx;
      const rawY = Math.min(ann.y, ann.y + ann.h);
      const h = Math.abs(ann.h) * sy;
      page.drawRectangle({
        x,
        y: flipY(rawY + Math.abs(ann.h)),
        width: w,
        height: h,
        borderColor: rgb(r, g, b),
        borderWidth: ann.lineWidth * Math.min(sx, sy),
        opacity: 0,
      });
    } else if (ann.type === "line") {
      const [r, g, b] = hexToRgb(ann.color);
      page.drawLine({
        start: { x: ann.x1 * sx, y: flipY(ann.y1) },
        end: { x: ann.x2 * sx, y: flipY(ann.y2) },
        thickness: ann.width * Math.min(sx, sy),
        color: rgb(r, g, b),
        lineCap: LineCapStyle.Round,
      });
    } else if (ann.type === "image") {
      const base64Data = ann.imageData.split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      let embeddedImage;
      if (ann.imageData.startsWith("data:image/png")) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (ann.imageData.startsWith("data:image/jpeg") || ann.imageData.startsWith("data:image/jpg")) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        continue;
      }
      const x = ann.x * sx;
      const y = flipY(ann.y + ann.h);
      const w = ann.w * sx;
      const h = ann.h * sy;
      page.drawImage(embeddedImage, { x, y, width: w, height: h });
    } else if (ann.type === "sticky-note") {
      // Draw a colored rectangle for sticky note background
      const colors: Record<string, [number, number, number]> = {
        yellow: [1, 1, 0],
        green: [0.2, 0.8, 0.2],
        blue: [0.2, 0.4, 0.8],
        pink: [1, 0.4, 0.7],
        orange: [1, 0.6, 0.2],
      };
      const [r, g, b] = colors[ann.color] || [1, 0.95, 0];
      const x = Math.min(ann.x, ann.x + ann.w) * sx;
      const w = Math.abs(ann.w) * sx;
      const rawY = Math.min(ann.y, ann.y + ann.h);
      const h = Math.abs(ann.h) * sy;
      page.drawRectangle({
        x,
        y: flipY(rawY + Math.abs(ann.h)),
        width: w,
        height: h,
        color: rgb(r, g, b),
        opacity: 0.7,
      });
    } else if (ann.type === "signature") {
      const base64Data = ann.imageData.split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      let embeddedImage;
      if (ann.imageData.startsWith("data:image/png")) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      }
      const x = ann.x * sx;
      const y = flipY(ann.y + ann.h);
      const w = ann.w * sx;
      const h = ann.h * sy;
      page.drawImage(embeddedImage, { x, y, width: w, height: h });
    } else if (ann.type === "form-field") {
      // Render form field value as text
      if (ann.value) {
        const [r, g, b] = hexToRgb("#000000");
        page.drawText(ann.value, {
          x: ann.x * sx,
          y: flipY(ann.y + ann.h) - 12,
          size: 12 * sy,
          font,
          color: rgb(r, g, b),
        });
      }
    }
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

/**
 * Rearrange pages in a PDF.
 */
export async function rearrangePDFPages(
  file: File,
  pageOrder: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const newPdfDoc = await PDFDocument.create();

  for (const pageIndex of pageOrder) {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
      newPdfDoc.addPage(copiedPage);
    }
  }

  stampTrustShieldMetadata(newPdfDoc);
  return newPdfDoc.save();
}

/**
 * Rotate a specific page in the PDF.
 */
export async function rotatePage(
  file: File,
  pageNumber: number,
  degrees: number
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const page = pages[pageNumber];
  if (page) {
    const currentRotation = (page as any).getRotation?.()?.angle ?? 0;
    page.setRotation(currentRotation + degrees);
  }
  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

/**
 * Delete a page from the PDF.
 */
export async function deletePage(
  file: File,
  pageNumber: number
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  pdfDoc.removePage(pageNumber);
  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

/**
 * Insert a blank page at a specific index.
 */
export async function insertBlankPage(
  file: File,
  index: number,
  width: number,
  height: number
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPage = pdfDoc.addPage([width, height]);
  pdfDoc.insertPage(index, newPage);
  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

/**
 * Fill form fields in the PDF.
 */
export async function fillFormFields(
  file: File,
  fields: { name: string; value: string }[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = (pdfDoc as any).getForm?.();
  if (form) {
    for (const field of fields) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldObj = form.getField(field.name);
      if (fieldObj) {
        fieldObj.setValue(field.value);
      }
    }
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

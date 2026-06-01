import { PDFDocument, rgb, StandardFonts, LineCapStyle, degrees } from "pdf-lib";
import { safeId } from "@/lib/safeId";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export type AnnotationTool =
  | "cursor"
  | "content"
  | "text"
  | "pen"
  | "highlight"
  | "rect"
  | "circle"
  | "line"
  | "arrow"
  | "whiteout"
  | "eraser"
  | "image"
  | "signature";

export interface BaseAnnotation {
  id: string;
  page: number;
  /** Painting order — lower renders beneath higher */
  zIndex?: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: "pen";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  size: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
}

export interface RectAnnotation extends BaseAnnotation {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lineWidth: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0–1, default applied in exporter */
  opacity?: number;
}

export interface CanvasDim {
  width: number;
  height: number;
  pdfWidth: number;
  pdfHeight: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  arrow?: boolean;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  imageData: string; // base64 data URL
  opacity?: number;
  /** Clockwise rotation in degrees (approximate projection in flattened PDF export) */
  rotationDeg?: number;
  /**
   * Snapshot of canvas CSS px ↔ PDF pt mapping for this stamp (survives Fabric re-serialize).
   * When set, export prefers this over dims[page].
   */
  exportDim?: CanvasDim;
}

export interface WhiteoutAnnotation extends BaseAnnotation {
  type: "whiteout";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lineWidth: number;
}

export type Annotation =
  | PenAnnotation
  | TextAnnotation
  | RectAnnotation
  | HighlightAnnotation
  | LineAnnotation
  | ImageAnnotation
  | CircleAnnotation
  | WhiteoutAnnotation;

/** Next z-index above every annotation targeting this page */
export function nextZIndexForPage(annotations: Annotation[], pageIndex: number): number {
  const onPage = annotations.filter((a) => a.page === pageIndex);
  return onPage.reduce((m, a) => Math.max(m, a.zIndex ?? 0), 0) + 1;
}

function sortAnns<T extends Annotation>(annotations: T[]): T[] {
  return [...annotations].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

export function bringForward(annotations: Annotation[], id: string): Annotation[] {
  const target = annotations.find((a) => a.id === id);
  if (!target) return annotations;
  const page = target.page;
  const idsOnPage = annotations.filter((a) => a.page === page).map((a) => a.id);
  const max = Math.max(...idsOnPage.map((i) => annotations.find((a) => a.id === i)!.zIndex ?? 0), 0);
  return annotations.map((a) => (a.id === id ? { ...a, zIndex: max + 1 } : a));
}

export function sendBackward(annotations: Annotation[], id: string): Annotation[] {
  const target = annotations.find((a) => a.id === id);
  if (!target) return annotations;
  const min = Math.min(...annotations.filter((a) => a.page === target.page).map((a) => a.zIndex ?? 0), 0);
  return annotations.map((a) => (a.id === id ? { ...a, zIndex: min - 1 } : a));
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function convertDataUrlToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext("2d");
      if (!ctx) { reject(new Error("canvas")); return; }
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("load"));
    img.src = dataUrl;
  });
}

export async function saveAnnotationsToPDF(
  file: File,
  annotations: Annotation[],
  dims: Record<number, CanvasDim>
): Promise<Uint8Array> {
  const { prepareAnnotationsForPdfExport } = await import("./penToImageStamp");
  const prepared = prepareAnnotationsForPdfExport(annotations, dims);

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const pages = pdfDoc.getPages();

  for (const ann of sortAnns(prepared)) {
    const page = pages[ann.page];
    if (!page) continue;
    const dim =
      ann.type === "image" && ann.exportDim ? ann.exportDim : dims[ann.page];
    if (!dim) continue;

    // Scale factors: canvas px → pdf units
    const sx = dim.pdfWidth / dim.width;
    const sy = dim.pdfHeight / dim.height;

    // canvas Y → pdf Y (flip vertical)
    const flipY = (cy: number) => dim.pdfHeight - cy * sy;

    if (ann.type === "text") {
      const [r, g, b] = hexToRgb(ann.color);
      const font = ann.bold && ann.italic ? fontBoldItalic : ann.bold ? fontBold : ann.italic ? fontItalic : fontRegular;
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
      const hlOpacity = typeof ann.opacity === "number" ? Math.min(1, Math.max(0.05, ann.opacity)) : 0.35;
      page.drawRectangle({
        x,
        y: flipY(rawY + Math.abs(ann.h)),
        width: w,
        height: h,
        color: rgb(1, 0.95, 0),
        opacity: hlOpacity,
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
    } else if (ann.type === "circle") {
      const [r, g, b] = hexToRgb(ann.color);
      const cx = (ann.x + ann.w / 2) * sx;
      const cy = flipY(ann.y + ann.h / 2);
      page.drawEllipse({
        x: cx,
        y: cy,
        xScale: Math.abs((ann.w * sx) / 2),
        yScale: Math.abs((ann.h * sy) / 2),
        borderColor: rgb(r, g, b),
        borderWidth: ann.lineWidth * Math.min(sx, sy),
      });
    } else if (ann.type === "line") {
      const [r, g, b] = hexToRgb(ann.color);
      const t = ann.width * Math.min(sx, sy);
      const ax1 = ann.x1 * sx;
      const ay1 = flipY(ann.y1);
      const ax2 = ann.x2 * sx;
      const ay2 = flipY(ann.y2);
      page.drawLine({
        start: { x: ax1, y: ay1 },
        end: { x: ax2, y: ay2 },
        thickness: t,
        color: rgb(r, g, b),
        lineCap: LineCapStyle.Round,
      });
      if (ann.arrow) {
        const dx = ax2 - ax1;
        const dy = ay2 - ay1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const head = Math.max(8, t * 5);
        const halfW = head * 0.45;
        const bx = ax2 - ux * head;
        const by = ay2 - uy * head;
        const px = -uy * halfW;
        const py = ux * halfW;
        const p1x = bx + px;
        const p1y = by + py;
        const p2x = bx - px;
        const p2y = by - py;
        const path = `M ${ax2} ${ay2} L ${p1x} ${p1y} L ${p2x} ${p2y} Z`;
        page.drawSvgPath(path, { color: rgb(r, g, b), borderWidth: 0 });
      }
    } else if (ann.type === "whiteout") {
      const x = Math.min(ann.x, ann.x + ann.w) * sx;
      const w = Math.abs(ann.w) * sx;
      const rawY = Math.min(ann.y, ann.y + ann.h);
      const h = Math.abs(ann.h) * sy;
      page.drawRectangle({
        x,
        y: flipY(rawY + Math.abs(ann.h)),
        width: w,
        height: h,
        color: rgb(1, 1, 1),
        opacity: 1,
      });
    } else if (ann.type === "image") {
      if (!ann.imageData.startsWith("data:image/")) {
        continue;
      }

      let dataUrl = ann.imageData;
      const isPng = dataUrl.startsWith("data:image/png");
      const isJpeg = dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg");

      if (!isPng && !isJpeg && typeof document !== "undefined") {
        try {
          dataUrl = await convertDataUrlToPng(dataUrl);
        } catch {
          continue;
        }
      }

      const comma = dataUrl.indexOf(",");
      if (comma < 0) continue;
      let imageBytes: Uint8Array;
      try {
        const base64Data = dataUrl.slice(comma + 1);
        imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      } catch {
        continue;
      }

      let embeddedImage;
      if (dataUrl.startsWith("data:image/png")) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        continue;
      }

      const x = ann.x * sx;
      const y = flipY(ann.y + ann.h);
      const w = ann.w * sx;
      const h = ann.h * sy;
      const rot = ann.rotationDeg ?? 0;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: w,
        height: h,
        opacity: Math.min(1, Math.max(0, ann.opacity ?? 1)),
        rotate: degrees(rot),
      });
    }
  }

  const { stampTrustShieldMetadata } = await import("@/lib/trustShield/pdfMetadata");
  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

export function genId(): string {
  return safeId("ann");
}

export async function rearrangePDFPages(file: File, pageOrder: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  // Create a new PDF with pages in the specified order
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

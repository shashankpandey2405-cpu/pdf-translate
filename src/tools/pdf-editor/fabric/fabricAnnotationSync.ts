import {
  Canvas,
  Polyline,
  IText,
  Rect,
  Ellipse,
  Line,
  FabricImage,
  util,
  Point,
  type FabricObject,
} from "fabric";
import type {
  Annotation,
  PenAnnotation,
  TextAnnotation,
  RectAnnotation,
  HighlightAnnotation,
  LineAnnotation,
  ImageAnnotation,
  CircleAnnotation,
  WhiteoutAnnotation,
} from "../logic";

export type PdfFabricKind =
  | "pen"
  | "text"
  | "rect"
  | "highlight"
  | "circle"
  | "line"
  | "image"
  | "whiteout";

export interface PdfFabricData {
  id: string;
  kind: PdfFabricKind;
  page: number;
  arrow?: boolean;
  zIndex?: number;
}

export function setPdfFabricData(target: unknown, data: PdfFabricData) {
  (target as { pdfData?: PdfFabricData }).pdfData = data;
}

export function getPdfFabricData(target: unknown): PdfFabricData | undefined {
  return (target as { pdfData?: PdfFabricData }).pdfData;
}

/** Stable JSON fingerprint for suppressing hydration echo-after-commit. */
export function fingerprintPageAnnotations(slice: Annotation[]): string {
  return JSON.stringify(
    [...slice].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
  );
}

export function polylineAbsolutePoints(pl: Polyline): { x: number; y: number }[] {
  const m = pl.calcTransformMatrix();
  const offX = pl.pathOffset?.x ?? 0;
  const offY = pl.pathOffset?.y ?? 0;
  const pts = pl.points ?? [];
  return pts.map((p) => {
    const t = util.transformPoint(new Point(p.x - offX, p.y - offY), m);
    return { x: t.x, y: t.y };
  });
}

export function lineAbsoluteEnds(L: Line): [{ x: number; y: number }, { x: number; y: number }] {
  const m = L.calcTransformMatrix();
  const p0 = util.transformPoint(new Point(L.x1 ?? 0, L.y1 ?? 0), m);
  const p1 = util.transformPoint(new Point(L.x2 ?? 0, L.y2 ?? 0), m);
  return [
    { x: p0.x, y: p0.y },
    { x: p1.x, y: p1.y },
  ];
}

export function fabricObjectToAnnotation(obj: FabricObject, pageIndex: number): Annotation | null {
  const pdf = getPdfFabricData(obj);
  if (!pdf) return null;

  if (pdf.kind === "pen" && obj.type === "polyline") {
    const coordinates = polylineAbsolutePoints(obj as Polyline);
    if (coordinates.length < 2) return null;
    const pl = obj as Polyline;
    const ann: PenAnnotation = {
      id: pdf.id,
      type: "pen",
      page: pageIndex,
      points: coordinates,
      color: (pl.stroke as string) || "#000",
      width: Number(pl.strokeWidth) || 2,
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "text" && (obj.type === "i-text" || obj.type === "text")) {
    const t = obj as IText;
    const fs = t.fontSize ?? 14;
    const ann: TextAnnotation = {
      id: pdf.id,
      type: "text",
      page: pageIndex,
      x: t.left ?? 0,
      y: (t.top ?? 0) + fs * 0.85,
      text: t.text ?? "",
      size: fs,
      color: typeof t.fill === "string" ? t.fill : "#0a1628",
      bold: (t.fontWeight as string) === "bold" || Number(t.fontWeight) >= 600,
      italic: t.fontStyle === "italic",
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "rect" && obj.type === "rect") {
    const r = obj as Rect;
    const ann: RectAnnotation = {
      id: pdf.id,
      type: "rect",
      page: pageIndex,
      x: r.left ?? 0,
      y: r.top ?? 0,
      w: (r.width ?? 0) * (r.scaleX ?? 1),
      h: (r.height ?? 0) * (r.scaleY ?? 1),
      color: (r.stroke as string) ?? "#000",
      lineWidth: r.strokeWidth ?? 2,
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "highlight" && obj.type === "rect") {
    const r = obj as Rect;
    const fill = r.fill as string;
    let opacity = 0.38;
    if (typeof fill === "string" && fill.includes("rgba")) {
      const m = fill.match(/,\s*([\d.]+)\s*\)/);
      if (m) opacity = parseFloat(m[1]!);
    }
    const ann: HighlightAnnotation = {
      id: pdf.id,
      type: "highlight",
      page: pageIndex,
      x: r.left ?? 0,
      y: r.top ?? 0,
      w: (r.width ?? 0) * (r.scaleX ?? 1),
      h: (r.height ?? 0) * (r.scaleY ?? 1),
      opacity,
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "whiteout" && obj.type === "rect") {
    const r = obj as Rect;
    const ann: WhiteoutAnnotation = {
      id: pdf.id,
      type: "whiteout",
      page: pageIndex,
      x: r.left ?? 0,
      y: r.top ?? 0,
      w: (r.width ?? 0) * (r.scaleX ?? 1),
      h: (r.height ?? 0) * (r.scaleY ?? 1),
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "circle" && obj.type === "ellipse") {
    const e = obj as Ellipse;
    const rx = (e.rx ?? 0) * (e.scaleX ?? 1);
    const ry = (e.ry ?? 0) * (e.scaleY ?? 1);
    const cx = e.left ?? 0;
    const cy = e.top ?? 0;
    const ann: CircleAnnotation = {
      id: pdf.id,
      type: "circle",
      page: pageIndex,
      x: cx - rx,
      y: cy - ry,
      w: rx * 2,
      h: ry * 2,
      color: (e.stroke as string) ?? "#000",
      lineWidth: e.strokeWidth ?? 2,
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "line" && obj.type === "line") {
    const L = obj as Line;
    const [p0, p1] = lineAbsoluteEnds(L);
    const ann: LineAnnotation = {
      id: pdf.id,
      type: "line",
      page: pageIndex,
      x1: p0.x,
      y1: p0.y,
      x2: p1.x,
      y2: p1.y,
      color: (L.stroke as string) ?? "#000",
      width: Number(L.strokeWidth) || 2,
      arrow: pdf.arrow,
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  if (pdf.kind === "image" && obj.type === "image") {
    const im = obj as FabricImage;
    let src = "";
    try {
      src = (typeof im.getSrc === "function" ? im.getSrc() : undefined)
        ?? (im as unknown as { _originalElement?: HTMLImageElement })._originalElement?.src
        ?? (im as unknown as { _element?: HTMLImageElement })._element?.src
        ?? "";
    } catch {
      src = "";
    }
    if (!src) return null;
    const ann: ImageAnnotation = {
      id: pdf.id,
      type: "image",
      page: pageIndex,
      x: im.left ?? 0,
      y: im.top ?? 0,
      w: (im.width ?? 0) * (im.scaleX ?? 1),
      h: (im.height ?? 0) * (im.scaleY ?? 1),
      imageData: src,
      opacity: im.opacity,
      rotationDeg: im.angle ?? 0,
      zIndex: pdf.zIndex,
    };
    return ann;
  }

  return null;
}

export function serializeCanvasToPageAnnotations(canvas: Canvas, pageIndex: number): Annotation[] {
  const objs = canvas.getObjects();
  const out: Annotation[] = [];
  let zi = 0;
  for (const o of objs) {
    const pdf = getPdfFabricData(o);
    if (!pdf) continue;
    const ann = fabricObjectToAnnotation(o, pageIndex);
    if (ann) {
      out.push({ ...ann, zIndex: pdf.zIndex ?? zi });
      zi++;
    }
  }
  return out;
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function annotationToFabricObject(
  ann: Annotation,
): Promise<FabricObject | null> {
  switch (ann.type) {
    case "pen": {
      if (ann.points.length < 2) return null;
      const xs = ann.points.map((p) => p.x);
      const ys = ann.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const rel = ann.points.map((p) => ({ x: p.x - minX, y: p.y - minY }));
      const pl = new Polyline(rel, {
        left: minX,
        top: minY,
        stroke: ann.color,
        strokeWidth: ann.width,
        fill: "",
        strokeLineCap: "round",
        strokeLineJoin: "round",
        objectCaching: false,
      });
      setPdfFabricData(pl, { id: ann.id, kind: "pen", page: ann.page });
      pl.set({ selectable: true, evented: true });
      return pl;
    }
    case "text": {
      const t = new IText(ann.text || " ", {
        left: ann.x,
        top: Math.max(0, ann.y - ann.size * 0.85),
        fill: ann.color,
        fontSize: ann.size,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: ann.bold ? "bold" : "normal",
        fontStyle: ann.italic ? "italic" : "normal",
      });
      setPdfFabricData(t, { id: ann.id, kind: "text", page: ann.page });
      return t;
    }
    case "rect": {
      const r = new Rect({
        left: ann.x,
        top: ann.y,
        width: Math.abs(ann.w),
        height: Math.abs(ann.h),
        fill: "",
        stroke: ann.color,
        strokeWidth: ann.lineWidth,
      });
      setPdfFabricData(r, { id: ann.id, kind: "rect", page: ann.page });
      return r;
    }
    case "highlight": {
      const op = ann.opacity ?? 0.38;
      const r = new Rect({
        left: ann.x,
        top: ann.y,
        width: Math.abs(ann.w),
        height: Math.abs(ann.h),
        fill: hexToRgba("#FFEB3B", op),
        stroke: "",
        opacity: 1,
      });
      setPdfFabricData(r, { id: ann.id, kind: "highlight", page: ann.page });
      return r;
    }
    case "whiteout": {
      const r = new Rect({
        left: ann.x,
        top: ann.y,
        width: Math.abs(ann.w),
        height: Math.abs(ann.h),
        fill: "#ffffff",
        stroke: "",
      });
      setPdfFabricData(r, { id: ann.id, kind: "whiteout", page: ann.page });
      return r;
    }
    case "circle": {
      const rx = Math.abs(ann.w / 2);
      const ry = Math.abs(ann.h / 2);
      const cx = ann.x + ann.w / 2;
      const cy = ann.y + ann.h / 2;
      const e = new Ellipse({
        left: cx,
        top: cy,
        rx,
        ry,
        originX: "center",
        originY: "center",
        fill: "",
        stroke: ann.color,
        strokeWidth: ann.lineWidth,
      });
      setPdfFabricData(e, { id: ann.id, kind: "circle", page: ann.page });
      return e;
    }
    case "line": {
      const line = new Line([ann.x1, ann.y1, ann.x2, ann.y2], {
        stroke: ann.color,
        strokeWidth: ann.width,
        strokeLineCap: "round",
      });
      setPdfFabricData(line, { id: ann.id, kind: "line", page: ann.page, arrow: !!ann.arrow });
      return line;
    }
    case "image": {
      try {
        const isDataUrl = ann.imageData.startsWith("data:");
        const img = await FabricImage.fromURL(
          ann.imageData,
          isDataUrl ? {} : { crossOrigin: "anonymous" },
        );
        if (!img || !img.width) return null;
        const iw = img.width;
        const ih = img.height || 1;
        img.set({
          left: ann.x,
          top: ann.y,
          scaleX: ann.w / iw,
          scaleY: ann.h / ih,
          opacity: ann.opacity ?? 1,
          angle: ann.rotationDeg ?? 0,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
        });
        setPdfFabricData(img, { id: ann.id, kind: "image", page: ann.page });
        return img;
      } catch (e) {
        console.warn("[fabricAnnotationSync] Failed to hydrate image annotation", ann.id, e);
        return null;
      }
    }
    default:
      return null;
  }
}

export async function hydrateAnnotationsOntoCanvas(canvas: Canvas, pageAnns: Annotation[]) {
  const prevRenderOnAddRemove = canvas.renderOnAddRemove;
  canvas.renderOnAddRemove = false;
  canvas.discardActiveObject();
  for (const obj of [...canvas.getObjects()]) {
    canvas.remove(obj);
  }
  const sorted = [...pageAnns].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  for (const ann of sorted) {
    const o = await annotationToFabricObject(ann);
    if (o) {
      const pdf = getPdfFabricData(o);
      if (pdf) pdf.zIndex = ann.zIndex;
      canvas.add(o);
    }
  }
  canvas.renderOnAddRemove = prevRenderOnAddRemove;
  canvas.requestRenderAll();
}

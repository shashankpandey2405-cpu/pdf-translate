import type { Annotation, CanvasDim, ImageAnnotation, PenAnnotation } from "./logic";

const PEN_RASTERIZE_MIN_POINTS = 24;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Rasterize pen polyline to PNG stamp for reliable PDF embedding in all viewers. */
export function penAnnotationToImageStamp(
  ann: PenAnnotation,
  dim: CanvasDim,
  padding = 8,
): ImageAnnotation | null {
  if (typeof document === "undefined" || ann.points.length < 2) return null;

  const xs = ann.points.map((p) => p.x);
  const ys = ann.points.map((p) => p.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;
  const w = Math.max(4, Math.ceil(maxX - minX));
  const h = Math.max(4, Math.ceil(maxY - minY));

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, w, h);
  const [r, g, b] = hexToRgb(ann.color.startsWith("#") ? ann.color : "#000000");
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = ann.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(ann.points[0]!.x - minX, ann.points[0]!.y - minY);
  for (let i = 1; i < ann.points.length; i++) {
    ctx.lineTo(ann.points[i]!.x - minX, ann.points[i]!.y - minY);
  }
  ctx.stroke();

  return {
    id: ann.id,
    type: "image",
    page: ann.page,
    x: minX,
    y: minY,
    w,
    h,
    imageData: canvas.toDataURL("image/png"),
    opacity: 1,
    rotationDeg: 0,
    exportDim: { ...dim },
    zIndex: ann.zIndex,
  };
}

export function shouldRasterizePen(ann: PenAnnotation): boolean {
  return ann.points.length >= PEN_RASTERIZE_MIN_POINTS;
}

export function prepareAnnotationsForPdfExport(
  annotations: Annotation[],
  dims: Record<number, CanvasDim>,
): Annotation[] {
  const out: Annotation[] = [];
  for (const ann of annotations) {
    if (ann.type !== "pen") {
      out.push(ann);
      continue;
    }
    const dim = dims[ann.page];
    if (!dim || !shouldRasterizePen(ann)) {
      out.push(ann);
      continue;
    }
    const stamped = penAnnotationToImageStamp(ann, dim);
    out.push(stamped ?? ann);
  }
  return out;
}

import type { Annotation } from "@/tools/pdf-editor/logic";

export type ResizeCorner = "nw" | "ne" | "sw" | "se";

export const HANDLE_RADIUS = 13;
/** Center of rotate handle sits above bbox top edge */
export const ROTATE_ABOVE = 34;
export const ROTATE_RADIUS = 15;
const MIN_BOX = 12;

export function sortPageAnns(annotations: Annotation[], pageIdx: number) {
  return annotations
    .filter((a) => a.page === pageIdx)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

export function bboxForAnn(ann: Annotation, ctx: CanvasRenderingContext2D): { x: number; y: number; w: number; h: number } | null {
  if (ann.type === "highlight" || ann.type === "rect" || ann.type === "whiteout") {
    return { x: ann.x, y: ann.y, w: ann.w, h: ann.h };
  }
  if (ann.type === "circle") return { x: ann.x, y: ann.y, w: ann.w, h: ann.h };
  if (ann.type === "image") return { x: ann.x, y: ann.y, w: ann.w, h: ann.h };
  if (ann.type === "text") {
    const style = `${ann.italic ? "italic " : ""}${ann.bold ? "700 " : ""}`;
    ctx.font = `${style}${ann.size}px Inter, sans-serif`;
    const tw = ctx.measureText(ann.text || " ").width;
    return { x: ann.x - 4, y: ann.y - ann.size * 0.95, w: Math.max(tw, 48) + 8, h: Math.max(ann.size * 1.4, ann.size + 12) };
  }
  if (ann.type === "line") {
    const pad = Math.max((ann.width || 2) * 3, 10);
    const x1 = ann.x1;
    const y1 = ann.y1;
    const x2 = ann.x2;
    const y2 = ann.y2;
    const xmin = Math.min(x1, x2) - pad;
    const ymin = Math.min(y1, y2) - pad;
    const xmax = Math.max(x1, x2) + pad;
    const ymax = Math.max(y1, y2) + pad;
    return { x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin };
  }
  if (ann.type === "pen") {
    if (ann.points.length === 0) return null;
    let minx = Infinity;
    let miny = Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;
    for (const p of ann.points) {
      minx = Math.min(minx, p.x);
      miny = Math.min(miny, p.y);
      maxx = Math.max(maxx, p.x);
      maxy = Math.max(maxy, p.y);
    }
    const pad = Math.max(ann.width * 2, 8);
    return { x: minx - pad, y: miny - pad, w: maxx - minx + pad * 2, h: maxy - miny + pad * 2 };
  }
  return null;
}

export function normalizedCorners(b: { x: number; y: number; w: number; h: number }) {
  const l = Math.min(b.x, b.x + b.w);
  const r = Math.max(b.x, b.x + b.w);
  const t = Math.min(b.y, b.y + b.h);
  const bot = Math.max(b.y, b.y + b.h);
  return { l, t, r, b: bot };
}

export function hitTestResizeCorner(px: number, py: number, b: { x: number; y: number; w: number; h: number }): ResizeCorner | null {
  const { l, t, r, b: bot } = normalizedCorners(b);
  const pts: [ResizeCorner, number, number][] = [
    ["nw", l, t],
    ["ne", r, t],
    ["sw", l, bot],
    ["se", r, bot],
  ];
  let cand: ResizeCorner | null = null;
  let dmin = Infinity;
  for (const [c, x, y] of pts) {
    const d = Math.hypot(px - x, py - y);
    if (d <= HANDLE_RADIUS && d < dmin) {
      dmin = d;
      cand = c;
    }
  }
  return cand;
}

export function hitTestRotateHandle(px: number, py: number, b: { x: number; y: number; w: number; h: number }): boolean {
  const { l, t, r } = normalizedCorners(b);
  const cx = (l + r) / 2;
  const hy = t - ROTATE_ABOVE;
  return Math.hypot(px - cx, py - hy) <= ROTATE_RADIUS;
}

function resizeCorners(l: number, t: number, r: number, bot: number, corner: ResizeCorner, px: number, py: number) {
  let nl = l;
  let nt = t;
  let nr = r;
  let nb = bot;
  switch (corner) {
    case "se":
      nr = px;
      nb = py;
      break;
    case "sw":
      nl = px;
      nb = py;
      break;
    case "ne":
      nr = px;
      nt = py;
      break;
    case "nw":
      nl = px;
      nt = py;
      break;
    default:
      break;
  }
  if (nr - nl < MIN_BOX) {
    if (corner === "sw" || corner === "nw") nl = nr - MIN_BOX;
    else nr = nl + MIN_BOX;
  }
  if (nb - nt < MIN_BOX) {
    if (corner === "nw" || corner === "ne") nt = nb - MIN_BOX;
    else nb = nt + MIN_BOX;
  }
  return { nl, nt, nr, nb };
}

export function applyCornerResize(
  ann: Annotation,
  corner: ResizeCorner,
  px: number,
  py: number,
  ctx: CanvasRenderingContext2D
): Annotation {
  const b = bboxForAnn(ann, ctx);
  if (!b) return ann;
  const { l, t, r, b: bot } = normalizedCorners(b);
  const { nl, nt, nr, nb } = resizeCorners(l, t, r, bot, corner, px, py);
  const x = nl;
  const y = nt;
  const w = nr - nl;
  const h = nb - nt;

  if (ann.type === "rect" || ann.type === "highlight" || ann.type === "circle" || ann.type === "whiteout" || ann.type === "image") {
    return { ...ann, x, y, w, h };
  }
  if (ann.type === "text") {
    const oldH = Math.max(Math.abs(b.h), 8);
    const newH = Math.max(Math.abs(h), 8);
    const scale = newH / oldH;
    const newSize = Math.max(8, Math.min(144, ann.size * scale));
    return { ...ann, x: x + 4, y: y + newSize * 0.95, size: newSize };
  }
  return ann;
}

export function applyImageRotation(
  ann: Extract<Annotation, { type: "image" }>,
  cx: number,
  cy: number,
  px: number,
  py: number,
  startAngleRad: number,
  baseRotationDeg: number
): Annotation {
  const ang = Math.atan2(py - cy, px - cx);
  const deltaDeg = ((ang - startAngleRad) * 180) / Math.PI;
  let next = baseRotationDeg + deltaDeg;
  next = ((next % 360) + 360) % 360;
  return { ...ann, rotationDeg: next };
}

export function ptInBBox(px: number, py: number, b: { x: number; y: number; w: number; h: number }) {
  const x1 = Math.min(b.x, b.x + b.w);
  const x2 = Math.max(b.x, b.x + b.w);
  const y1 = Math.min(b.y, b.y + b.h);
  const y2 = Math.max(b.y, b.y + b.h);
  return px >= x1 && px <= x2 && py >= y1 && py <= y2;
}

export function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let tt = lenSq ? dot / lenSq : -1;
  tt = Math.max(0, Math.min(1, tt));
  const qx = x1 + tt * C;
  const qy = y1 + tt * D;
  return Math.hypot(px - qx, py - qy);
}

export function hitTestAnnotationId(
  px: number,
  py: number,
  annotations: Annotation[],
  pageIdx: number,
  ctx: CanvasRenderingContext2D
): string | null {
  const list = [...sortPageAnns(annotations, pageIdx)].reverse();
  for (const ann of list) {
    const bbox = bboxForAnn(ann, ctx);
    if (!bbox) continue;
    if (ann.type === "line") {
      const dist = distanceToSegment(px, py, ann.x1, ann.y1, ann.x2, ann.y2);
      if (dist < Math.max(ann.width * 2, 10)) return ann.id;
      continue;
    }
    if (ann.type === "pen") {
      for (let i = 1; i < ann.points.length; i++) {
        const d = distanceToSegment(px, py, ann.points[i - 1].x, ann.points[i - 1].y, ann.points[i].x, ann.points[i].y);
        if (d < Math.max(ann.width * 2.5, 10)) return ann.id;
      }
      continue;
    }
    if (ptInBBox(px, py, bbox)) return ann.id;
  }
  return null;
}

export type CursorInteraction =
  | { mode: "move"; id: string; origin: { x: number; y: number }; before: Annotation[] }
  | { mode: "resize"; id: string; corner: ResizeCorner; before: Annotation[] }
  | {
      mode: "rotate";
      id: string;
      center: { x: number; y: number };
      baseRotationDeg: number;
      startAngleRad: number;
      before: Annotation[];
    };

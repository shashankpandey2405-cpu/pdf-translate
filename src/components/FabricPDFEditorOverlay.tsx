import { useRef, useEffect } from "react";
import { Canvas, Polyline, IText, Rect, Ellipse, Line, FabricImage, type TPointerEventInfo } from "fabric";
import type { Annotation, AnnotationTool, ImageAnnotation } from "@/tools/pdf-editor/logic";
import { genId } from "@/tools/pdf-editor/logic";
import {
  setPdfFabricData,
  getPdfFabricData,
  serializeCanvasToPageAnnotations,
  hydrateAnnotationsOntoCanvas,
  fingerprintPageAnnotations,
} from "@/tools/pdf-editor/fabric/fabricAnnotationSync";
import { smoothStrokePoints } from "@/lib/strokeSmoothing";

function mergePageIntoAll(all: Annotation[], pageIndex: number, pageAnns: Annotation[]): Annotation[] {
  const rest = all.filter((a) => a.page !== pageIndex);
  return [...rest, ...pageAnns];
}

interface Props {
  width: number;
  height: number;
  pageIndex: number;
  annotations: Annotation[];
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  fontSize: number;
  textBold: boolean;
  textItalic: boolean;
  defaultImageOpacity: number;
  selectedId: string | null | undefined;
  onSelectId?: (id: string | null) => void;
  onAnnotationsCommit?: (next: Annotation[]) => void;
  onAdd: (ann: Annotation) => void;
}

/**
 * Fabric.js overlay for vector editing. Coordinates use the same canvas space as pdf.js + pdf-lib export.
 */
export function FabricPDFEditorOverlay({
  width,
  height,
  pageIndex,
  annotations,
  tool,
  color,
  lineWidth,
  fontSize,
  textBold,
  textItalic,
  defaultImageOpacity,
  selectedId,
  onSelectId,
  onAnnotationsCommit,
  onAdd,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const annotationsRef = useRef(annotations);
  const pageIndexRef = useRef(pageIndex);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const lineWidthRef = useRef(lineWidth);
  const fontSizeRef = useRef(fontSize);
  const textBoldRef = useRef(textBold);
  const textItalicRef = useRef(textItalic);
  const defaultImageOpacityRef = useRef(defaultImageOpacity);
  const onAnnotationsCommitRef = useRef(onAnnotationsCommit);
  const onSelectIdRef = useRef(onSelectId);
  const onAddRef = useRef(onAdd);
  annotationsRef.current = annotations;
  pageIndexRef.current = pageIndex;
  toolRef.current = tool;
  colorRef.current = color;
  lineWidthRef.current = lineWidth;
  fontSizeRef.current = fontSize;
  textBoldRef.current = textBold;
  textItalicRef.current = textItalic;
  defaultImageOpacityRef.current = defaultImageOpacity;
  onAnnotationsCommitRef.current = onAnnotationsCommit;
  onSelectIdRef.current = onSelectId;
  onAddRef.current = onAdd;

  const mirrorSigRef = useRef("");
  const suppressCommitRef = useRef(0);
  const hydrationIdRef = useRef(0);
  const penPointsRef = useRef<{ x: number; y: number }[]>([]);
  type DragKind = "rect" | "highlight" | "whiteout" | "circle" | "line" | "arrow" | null;
  const dragRef = useRef<{ kind: DragKind; x0: number; y0: number; preview?: Rect | Ellipse | Line } | null>(null);

  // Create / resize Fabric canvas (dimensions only — callbacks via refs so parent identity does not recreate canvas)
  useEffect(() => {
    const host = hostRef.current;
    if (!host || width < 8 || height < 8) return;

    host.innerHTML = "";
    const canvasEl = document.createElement("canvas");
    canvasEl.style.display = "block";
    host.appendChild(canvasEl);

    const canvas = new Canvas(canvasEl, {
      width,
      height,
      selection: true,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });
    fabricRef.current = canvas;

    const syncViewportToHost = () => {
      const hostEl = hostRef.current;
      if (!hostEl || width < 8 || height < 8) return;
      const rw = Math.max(1, hostEl.clientWidth);
      const rh = Math.max(1, hostEl.clientHeight);
      const sx = rw / width;
      const sy = rh / height;
      canvas.setDimensions({ width: rw, height: rh });
      canvas.setViewportTransform([sx, 0, 0, sy, 0, 0]);
      canvas.requestRenderAll();
    };

    syncViewportToHost();

    const flushCommit = () => {
      if (suppressCommitRef.current > 0) return;
      const c = fabricRef.current;
      if (!c) return;
      const pi = pageIndexRef.current;
      const pageAnns = serializeCanvasToPageAnnotations(c, pi);
      mirrorSigRef.current = fingerprintPageAnnotations(pageAnns);
      const merged = mergePageIntoAll(annotationsRef.current, pi, pageAnns);
      onAnnotationsCommitRef.current?.(merged);
    };

    const onSelCreate = (e: { selected?: unknown[] }) => {
      const t = e.selected?.[0] as import("fabric").FabricObject | undefined;
      const id = t ? getPdfFabricData(t)?.id : undefined;
      onSelectIdRef.current?.(id ?? null);
    };
    const onSelUpd = (e: { selected?: unknown[] }) => {
      const t = e.selected?.[0] as import("fabric").FabricObject | undefined;
      const id = t ? getPdfFabricData(t)?.id : undefined;
      onSelectIdRef.current?.(id ?? null);
    };

    canvas.on("selection:created", onSelCreate);
    canvas.on("selection:updated", onSelUpd);
    canvas.on("selection:cleared", () => onSelectIdRef.current?.(null));
    canvas.on("object:modified", () => flushCommit());

    let textDebounce = 0;
    canvas.on("text:changed", () => {
      window.clearTimeout(textDebounce);
      textDebounce = window.setTimeout(() => flushCommit(), 250);
    });

    const pt = (opt: TPointerEventInfo) => {
      const p = canvas.getScenePoint(opt.e);
      return { x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 };
    };

    const pushPenPoint = (p: { x: number; y: number }) => {
      const pts = penPointsRef.current;
      const last = pts[pts.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
      pts.push(p);
    };

    const clearPenDrafts = () => {
      canvas.getObjects().forEach((o) => {
        if ((o as { isPenDraft?: boolean }).isPenDraft) canvas.remove(o);
      });
    };

    const clearDragPreviews = () => {
      canvas.getObjects().forEach((o) => {
        if ((o as { isDragPreview?: boolean }).isDragPreview) canvas.remove(o);
      });
    };

    const onDown = (opt: TPointerEventInfo) => {
      const tTool = toolRef.current;
      const pi = pageIndexRef.current;

      if (tTool === "content" || tTool === "signature") return;
      if (tTool === "cursor") return;

      opt.e.preventDefault();
      opt.e.stopPropagation();

      const p = pt(opt);

      if (tTool === "eraser") {
        const info = canvas.findTarget(opt.e);
        const hit = info.target ?? info.currentTarget ?? info.subTargets[0];
        if (hit && getPdfFabricData(hit)) {
          canvas.remove(hit);
          flushCommit();
        }
        return;
      }

      if (tTool === "image") {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "image/*";
        inp.onchange = (ev) => {
          const f = (ev.target as HTMLInputElement).files?.[0];
          if (!f) return;
          if (f.size > 10 * 1024 * 1024) {
            window.alert("Please use images up to 10MB for smooth editing in your browser.");
            return;
          }

          const objectUrl = URL.createObjectURL(f);
          const reader = new FileReader();
          reader.onload = () => {
            const imageData = reader.result as string;
            void FabricImage.fromURL(objectUrl, { crossOrigin: "anonymous" })
              .then((img) => {
                if (!img || !img.width) throw new Error("Image load failed");
                const iw = img.width;
                const ih = img.height || 1;
                let w = iw;
                let h = ih;
                const max = 220;
                if (w > max) {
                  h = (h * max) / w;
                  w = max;
                }
                if (h > max) {
                  w = (w * max) / h;
                  h = max;
                }
                img.set({
                  left: p.x,
                  top: p.y,
                  scaleX: w / iw,
                  scaleY: h / ih,
                  opacity: defaultImageOpacityRef.current,
                  selectable: true,
                  evented: true,
                  hasControls: true,
                  hasBorders: true,
                });
                const id = genId();
                setPdfFabricData(img, { id, kind: "image", page: pi });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.requestRenderAll();
                const ann: ImageAnnotation = {
                  id,
                  type: "image",
                  page: pi,
                  x: p.x,
                  y: p.y,
                  w,
                  h,
                  imageData,
                  opacity: defaultImageOpacityRef.current,
                  rotationDeg: 0,
                };
                onAddRef.current(ann);
              })
              .catch(() => {
                const ann: ImageAnnotation = {
                  id: genId(),
                  type: "image",
                  page: pi,
                  x: p.x,
                  y: p.y,
                  w: 120,
                  h: 80,
                  imageData,
                  opacity: defaultImageOpacityRef.current,
                  rotationDeg: 0,
                };
                onAddRef.current(ann);
              })
              .finally(() => {
                URL.revokeObjectURL(objectUrl);
              });
          };
          reader.readAsDataURL(f);
        };
        inp.click();
        return;
      }

      if (tTool === "text") {
        const tb = new IText("Text", {
          left: p.x,
          top: p.y,
          fill: colorRef.current,
          fontSize: fontSizeRef.current,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: textBoldRef.current ? "bold" : "normal",
          fontStyle: textItalicRef.current ? "italic" : "normal",
        });
        setPdfFabricData(tb, { id: genId(), kind: "text", page: pi });
        canvas.add(tb);
        canvas.setActiveObject(tb);
        tb.enterEditing();
        tb.selectAll();
        flushCommit();
        return;
      }

      if (tTool === "pen") {
        penPointsRef.current = [];
        pushPenPoint(p);
        return;
      }

      const dk: DragKind =
        tTool === "highlight"
          ? "highlight"
          : tTool === "whiteout"
            ? "whiteout"
            : tTool === "rect"
              ? "rect"
              : tTool === "circle"
                ? "circle"
                : tTool === "line"
                  ? "line"
                  : tTool === "arrow"
                    ? "arrow"
                    : null;

      if (dk) dragRef.current = { kind: dk, x0: p.x, y0: p.y };
    };

    const onMove = (opt: TPointerEventInfo) => {
      const tTool = toolRef.current;
      if (tTool === "content" || tTool === "signature" || tTool === "cursor") return;
      const p = pt(opt);

      if (tTool === "pen" && penPointsRef.current.length) {
        pushPenPoint(p);
        const pts = penPointsRef.current;
        if (pts.length < 2) return;
        clearPenDrafts();
        const xs = pts.map((q) => q.x);
        const ys = pts.map((q) => q.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const rel = pts.map((q) => ({ x: q.x - minX, y: q.y - minY }));
        const pl = new Polyline(rel, {
          left: minX,
          top: minY,
          stroke: colorRef.current,
          strokeWidth: lineWidthRef.current,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
          objectCaching: false,
        });
        (pl as Polyline & { isPenDraft?: boolean }).isPenDraft = true;
        canvas.add(pl);
        canvas.requestRenderAll();
        return;
      }

      const d = dragRef.current;
      if (!d?.kind) return;
      const { x0, y0 } = d;
      const w = p.x - x0;
      const h = p.y - y0;
      if (d.preview) canvas.remove(d.preview);

      const col = colorRef.current;
      const lw = lineWidthRef.current;

      if (d.kind === "rect" || d.kind === "highlight" || d.kind === "whiteout") {
        const preview = new Rect({
          left: Math.min(x0, p.x),
          top: Math.min(y0, p.y),
          width: Math.abs(w),
          height: Math.abs(h),
          fill: d.kind === "highlight" ? "rgba(255,235,59,0.38)" : d.kind === "whiteout" ? "#ffffff" : "",
          stroke: d.kind === "rect" ? col : "",
          strokeWidth: d.kind === "rect" ? lw : 0,
        });
        (preview as Rect & { isDragPreview?: boolean }).isDragPreview = true;
        canvas.add(preview);
        d.preview = preview;
      } else if (d.kind === "circle") {
        const cx = x0 + w / 2;
        const cy = y0 + h / 2;
        const el = new Ellipse({
          left: cx,
          top: cy,
          originX: "center",
          originY: "center",
          rx: Math.max(4, Math.abs(w / 2)),
          ry: Math.max(4, Math.abs(h / 2)),
          fill: "",
          stroke: col,
          strokeWidth: lw,
        });
        (el as Ellipse & { isDragPreview?: boolean }).isDragPreview = true;
        canvas.add(el);
        d.preview = el;
      } else if (d.kind === "line" || d.kind === "arrow") {
        const line = new Line([x0, y0, p.x, p.y], {
          stroke: col,
          strokeWidth: lw,
          strokeLineCap: "round",
        });
        (line as Line & { isDragPreview?: boolean }).isDragPreview = true;
        canvas.add(line);
        d.preview = line;
      }
      canvas.requestRenderAll();
    };

    const onUp = (opt: TPointerEventInfo) => {
      const tTool = toolRef.current;
      if (tTool === "content" || tTool === "signature" || tTool === "cursor") return;
      const p = pt(opt);
      const pi = pageIndexRef.current;
      const col = colorRef.current;
      const lw = lineWidthRef.current;

      if (tTool === "pen" && penPointsRef.current.length > 1) {
        clearPenDrafts();
        const pts = smoothStrokePoints(penPointsRef.current, { minDist: 2.5, chaikinPasses: 2 });
        penPointsRef.current = [];
        const xs = pts.map((q) => q.x);
        const ys = pts.map((q) => q.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const rel = pts.map((q) => ({ x: q.x - minX, y: q.y - minY }));
        const pl = new Polyline(rel, {
          left: minX,
          top: minY,
          stroke: col,
          strokeWidth: lw,
          fill: "",
          strokeLineCap: "round",
          strokeLineJoin: "round",
          objectCaching: false,
        });
        const id = genId();
        setPdfFabricData(pl, { id, kind: "pen", page: pi });
        canvas.add(pl);
        flushCommit();
        return;
      }
      penPointsRef.current = [];

      const d = dragRef.current;
      if (!d?.kind) return;
      if (d.preview) canvas.remove(d.preview);
      dragRef.current = null;

      const { x0, y0 } = d;
      if (Math.abs(p.x - x0) < 4 && Math.abs(p.y - y0) < 4) {
        canvas.requestRenderAll();
        return;
      }

      if (d.kind === "rect") {
        const r = new Rect({
          left: Math.min(x0, p.x),
          top: Math.min(y0, p.y),
          width: Math.abs(p.x - x0),
          height: Math.abs(p.y - y0),
          fill: "",
          stroke: col,
          strokeWidth: lw,
        });
        const id = genId();
        setPdfFabricData(r, { id, kind: "rect", page: pi });
        canvas.add(r);
      } else if (d.kind === "highlight") {
        const r = new Rect({
          left: Math.min(x0, p.x),
          top: Math.min(y0, p.y),
          width: Math.abs(p.x - x0),
          height: Math.abs(p.y - y0),
          fill: "rgba(255,235,59,0.38)",
          stroke: "",
        });
        const id = genId();
        setPdfFabricData(r, { id, kind: "highlight", page: pi });
        canvas.add(r);
      } else if (d.kind === "whiteout") {
        const r = new Rect({
          left: Math.min(x0, p.x),
          top: Math.min(y0, p.y),
          width: Math.abs(p.x - x0),
          height: Math.abs(p.y - y0),
          fill: "#ffffff",
          stroke: "",
        });
        const id = genId();
        setPdfFabricData(r, { id, kind: "whiteout", page: pi });
        canvas.add(r);
      } else if (d.kind === "circle") {
        const wf = p.x - x0;
        const hf = p.y - y0;
        const cx = x0 + wf / 2;
        const cy = y0 + hf / 2;
        const el = new Ellipse({
          left: cx,
          top: cy,
          originX: "center",
          originY: "center",
          rx: Math.max(4, Math.abs(wf / 2)),
          ry: Math.max(4, Math.abs(hf / 2)),
          fill: "",
          stroke: col,
          strokeWidth: lw,
        });
        const id = genId();
        setPdfFabricData(el, { id, kind: "circle", page: pi });
        canvas.add(el);
      } else if (d.kind === "line" || d.kind === "arrow") {
        const line = new Line([x0, y0, p.x, p.y], {
          stroke: col,
          strokeWidth: lw,
          strokeLineCap: "round",
        });
        const id = genId();
        setPdfFabricData(line, { id, kind: "line", page: pi, arrow: d.kind === "arrow" });
        canvas.add(line);
      }
      flushCommit();
      clearDragPreviews();
      canvas.requestRenderAll();
    };

    canvas.on("mouse:down", onDown);
    canvas.on("mouse:move", onMove);
    canvas.on("mouse:up", onUp);

    let resizeTmr: number | undefined;
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            window.clearTimeout(resizeTmr);
            resizeTmr = window.setTimeout(syncViewportToHost, 50);
          })
        : null;
    ro?.observe(host);

    mirrorSigRef.current = "";

    return () => {
      window.clearTimeout(resizeTmr);
      ro?.disconnect();
      window.clearTimeout(textDebounce);
      canvas.off();
      canvas.dispose();
      host.innerHTML = "";
      fabricRef.current = null;
    };
  }, [width, height]);

  // Reset mirror fingerprint when navigating pages so hydration always applies
  useEffect(() => {
    mirrorSigRef.current = "";
  }, [pageIndex]);

  // Hydrate Fabric from React state when external edits / undo arrive
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const pi = pageIndex;
    const slice = annotations.filter((a) => a.page === pi);
    const incoming = fingerprintPageAnnotations(slice);
    if (incoming === mirrorSigRef.current) return;
    mirrorSigRef.current = incoming;
    const thisHydration = ++hydrationIdRef.current;
    suppressCommitRef.current += 1;
    void hydrateAnnotationsOntoCanvas(c, slice)
      .then(() => {
        if (thisHydration !== hydrationIdRef.current) return;
        if (selectedId) {
          const obj = c.getObjects().find((o) => getPdfFabricData(o)?.id === selectedId);
          if (obj) c.setActiveObject(obj);
        } else {
          c.discardActiveObject();
        }
        c.requestRenderAll();
      })
      .finally(() => {
        requestAnimationFrame(() => {
          suppressCommitRef.current = Math.max(0, suppressCommitRef.current - 1);
        });
      });
  }, [annotations, pageIndex, selectedId, width, height]);

  // Tool interaction policy
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const cursorLike = tool === "cursor";
    c.selection = cursorLike;

    const targetSkip =
      tool === "pen" ||
      tool === "highlight" ||
      tool === "rect" ||
      tool === "circle" ||
      tool === "line" ||
      tool === "arrow" ||
      tool === "whiteout" ||
      tool === "text" ||
      tool === "image";

    c.skipTargetFind = targetSkip || tool === "signature";
    c.forEachObject((o) => {
      o.selectable = cursorLike || tool === "eraser";
      o.evented = tool !== "content" && tool !== "signature";
    });
    if (!cursorLike) c.discardActiveObject();
    c.requestRenderAll();
  }, [tool]);

  const pointerBlock = tool === "content";

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-[12] touch-none [&_.canvas-container]:!h-full [&_.canvas-container]:!w-full [&_canvas]:!block [&_canvas]:!h-full [&_canvas]:!w-full"
      style={{
        pointerEvents: pointerBlock ? "none" : "auto",
      }}
      data-testid="fabric-pdf-overlay"
    />
  );
}

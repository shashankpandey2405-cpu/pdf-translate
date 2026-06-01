import { useRef, useEffect, useState, forwardRef, useImperativeHandle, lazy, Suspense } from "react";
import type {
  Annotation,
  AnnotationTool,
  CanvasDim,
} from "@/tools/pdf-editor/logic";
import { PdfContentHitLayer } from "@/tools/pdf-editor/components/PdfContentHitLayer";
import type { ContentPick } from "@/tools/pdf-editor/components/PdfContentHitLayer";
import { getPdfViewportMaxScale } from "@/lib/pdfRenderBudget";
import { getPdfEngine } from "@/pdf-engine/engineProvider";

const FabricPDFEditorOverlay = lazy(() =>
  import("@/components/FabricPDFEditorOverlay").then((mod) => ({
    default: mod.FabricPDFEditorOverlay,
  })),
);

function FabricOverlayFallback() {
  return <div className="absolute inset-0 animate-pulse bg-muted/20" aria-hidden />;
}

interface Props {
  file: File;
  pageNumber: number;
  annotations: Annotation[];
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  fontSize: number;
  textBold?: boolean;
  textItalic?: boolean;
  defaultImageOpacity?: number;
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
  onAnnotationsCommit?: (next: Annotation[]) => void;
  onContentPick?: (pick: ContentPick) => void;
  onAdd: (ann: Annotation) => void;
  onDimUpdate: (page: number, dim: CanvasDim) => void;
  contentPickHint?: string;
  /** Caps pdf.js raster scale (defaults to device-aware budget). */
  maxViewportScale?: number;
  /** Multiplier applied on top of the locked base scale (user zoom). Default 1. */
  zoomFactor?: number;
  /** Increment to force recomputing fit-to-width base scale. */
  fitWidthNonce?: number;
}

export interface PDFEditorCanvasHandle {
  getCanvasDim: () => CanvasDim | null;
}

/**
 * Renders each PDF page with pdf.js, overlays a Fabric.js scene for annotations, and keeps a text-hit layer for content edit.
 * Base pdf.js scale is computed once per page/file until "fit width" is requested — no automatic resize-driven rerenders.
 */
export const PDFEditorCanvas = forwardRef<PDFEditorCanvasHandle, Props>(function PDFEditorCanvas(
  {
    file,
    pageNumber,
    annotations,
    tool,
    color,
    lineWidth,
    fontSize,
    textBold = false,
    textItalic = false,
    defaultImageOpacity = 1,
    selectedId,
    onSelectId,
    onAnnotationsCommit,
    onContentPick,
    onAdd,
    onDimUpdate,
    contentPickHint,
    maxViewportScale,
    zoomFactor = 1,
    fitWidthNonce = 0,
  },
  ref
) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<CanvasDim | null>(null);
  const baseScaleRef = useRef<number | null>(null);
  const onDimUpdateRef = useRef(onDimUpdate);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 1131 });
  const scaleCap = maxViewportScale ?? getPdfViewportMaxScale();

  useImperativeHandle(ref, () => ({
    getCanvasDim: () => dimRef.current,
  }));

  /** Drop cached fit scale when file/page changes or user triggers fit-width — not when zoomFactor alone changes. */
  useEffect(() => {
    baseScaleRef.current = null;
  }, [file, pageNumber, fitWidthNonce]);

  useEffect(() => {
    onDimUpdateRef.current = onDimUpdate;
  }, [onDimUpdate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const engine = await getPdfEngine();
        const doc = await engine.open(file);
        try {
          const size = doc.getPageSize(pageNumber);
          const containerW = containerRef.current?.clientWidth ?? 800;

          if (baseScaleRef.current === null) {
            baseScaleRef.current = Math.min((Math.max(containerW, 120) - 32) / size.width, scaleCap);
          }

          const scale = baseScaleRef.current * zoomFactor;
          const scaled = {
            width: Math.max(1, Math.round(size.width * scale)),
            height: Math.max(1, Math.round(size.height * scale)),
          };

          if (cancelled) return;
          setCanvasSize({ w: scaled.width, h: scaled.height });

          const dim: CanvasDim = {
            width: scaled.width,
            height: scaled.height,
            pdfWidth: size.width,
            pdfHeight: size.height,
          };
          dimRef.current = dim;
          onDimUpdateRef.current(pageNumber - 1, dim);

          await new Promise<void>((resolve) => {
            requestAnimationFrame(async () => {
              const bg = bgCanvasRef.current;
              if (!bg || cancelled) {
                resolve();
                return;
              }
              await doc.renderPageToCanvas(bg, { pageNumber, scale });
              resolve();
            });
          });
        } finally {
          doc.destroy();
        }
      } catch {
        if (!cancelled) {
          dimRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, pageNumber, scaleCap, zoomFactor, fitWidthNonce]);

  return (
    <div className="flex w-full max-w-full justify-center">
      <div
        ref={containerRef}
        className="relative mx-auto max-w-full touch-manipulation select-none overflow-hidden rounded-2xl bg-white shadow-xl"
        style={
          {
            width: "100%",
            maxWidth: canvasSize.w,
            aspectRatio: `${canvasSize.w} / ${canvasSize.h}`,
          } as React.CSSProperties
        }
        data-testid="pdf-editor-canvas-container"
      >
        <canvas
          ref={bgCanvasRef}
          className="pointer-events-none absolute inset-0 block h-full w-full"
          data-testid="pdf-bg-canvas"
        />
        <Suspense fallback={<FabricOverlayFallback />}>
          <FabricPDFEditorOverlay
            width={canvasSize.w}
            height={canvasSize.h}
            pageIndex={pageNumber - 1}
            annotations={annotations}
            tool={tool}
            color={color}
            lineWidth={lineWidth}
            fontSize={fontSize}
            textBold={textBold}
            textItalic={textItalic}
            defaultImageOpacity={defaultImageOpacity}
            selectedId={selectedId}
            onSelectId={onSelectId}
            onAnnotationsCommit={onAnnotationsCommit}
            onAdd={onAdd}
          />
        </Suspense>
        <PdfContentHitLayer
          file={file}
          pageNumber={pageNumber}
          canvasWidth={canvasSize.w}
          canvasHeight={canvasSize.h}
          enabled={tool === "content" && !!onContentPick}
          pickHint={contentPickHint}
          onPick={(p) => {
            if (tool === "content") onContentPick?.(p);
          }}
        />
      </div>
    </div>
  );
});

import { useEffect, useRef, useState } from "react";
import { renderPageToCanvas } from "@/tools/pdf-editor/services/pdfRenderService";
import type { WatermarkOptions } from "@/tools/watermark-pdf/logic";

type Props = {
  file: File;
  text: string;
  fontSize: number;
  opacity: number;
  color: WatermarkOptions["color"];
  rotation: number;
  zoom: number;
  anchorX: number;
  anchorY: number;
  onAnchorChange: (anchorX: number, anchorY: number) => void;
};

function textColor(color: WatermarkOptions["color"]): string {
  if (color === "red") return "#ef4444";
  if (color === "blue") return "#2563eb";
  if (color === "black") return "#111827";
  return "#6b7280";
}

export default function LiveWatermarkPreview({
  file,
  text,
  fontSize,
  opacity,
  color,
  rotation,
  zoom,
  anchorX,
  anchorY,
  onAnchorChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      if (!canvasRef.current) return;
      setLoading(true);
      try {
        await renderPageToCanvas(file, 1, canvasRef.current, Math.max(0.8, zoom * 1.2));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [file, zoom]);

  function setAnchorFromPointer(clientX: number, clientY: number) {
    if (!hostRef.current) return;
    const rect = hostRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(rect.width, 1);
    const y = 1 - (clientY - rect.top) / Math.max(rect.height, 1);
    onAnchorChange(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y)));
  }

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Live Preview</span>
        <span>{loading ? "Rendering..." : "Drag text to position"}</span>
      </div>
      <div
        ref={hostRef}
        className="relative mx-auto max-h-[560px] overflow-auto rounded-lg border border-border bg-white"
        onPointerMove={(e) => {
          if (!dragging) return;
          setAnchorFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
      >
        <canvas ref={canvasRef} className="mx-auto h-auto max-w-full" />
        {!loading && (
          <button
            type="button"
            className="absolute cursor-grab select-none border border-white/80 bg-white/30 px-2 py-1 font-bold backdrop-blur-sm active:cursor-grabbing"
            style={{
              left: `${anchorX * 100}%`,
              top: `${(1 - anchorY) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              color: textColor(color),
              opacity,
              fontSize: `${Math.min(36, Math.max(12, fontSize * 0.35))}px`,
              borderRadius: "8px",
            }}
            onPointerDown={(e) => {
              setDragging(true);
              setAnchorFromPointer(e.clientX, e.clientY);
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
          >
            {text || "CONFIDENTIAL"}
          </button>
        )}
      </div>
    </div>
  );
}

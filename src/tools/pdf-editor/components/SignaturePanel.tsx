import { useState, useRef } from "react";

interface Props {
  onAdd: (signatureDataUrl: string) => void;
  onClose: () => void;
}

export function SignaturePanel({ onAdd, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onAdd(dataUrl);
    onClose();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 bg-card border border-border rounded-xl p-4 shadow-xl w-80">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">✍️ Digital Signature</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        className="w-full border border-border rounded-lg bg-white cursor-crosshair mb-2"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="flex-1 px-3 py-1.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!hasSignature}
          className="flex-1 px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Add Signature
        </button>
      </div>
    </div>
  );
}

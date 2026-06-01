import { useState, useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { logDriverHealth } from "@/utils/logger";
import { getPdfEngine } from "@/pdf-engine/engineProvider";

interface PDFThumbnailProps {
  file: File;
  pageNumber?: number;
  width?: number;
  className?: string;
}

import { getRenderDprCap } from "@/lib/render/canvasBudget";
import { isMobileSafari } from "@/lib/download/isIOS";

export async function canvasToPreviewUrl(canvas: HTMLCanvasElement, quality = 0.85): Promise<string> {
  if (canvas.width < 1 || canvas.height < 1) {
    throw new Error("empty_canvas");
  }
  if (isMobileSafari()) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", Math.min(quality, 0.82));
    });
    if (blob && blob.size > 64) {
      return URL.createObjectURL(blob);
    }
  }
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (dataUrl.length < 32) throw new Error("empty_canvas");
  return dataUrl;
}

export async function renderPDFPage(file: File, pageNum = 1, scale = 0.5): Promise<string> {
  const canvas = document.createElement("canvas");
  const mobile = isMobileSafari();
  let safeScale = scale;
  if (mobile) {
    safeScale = Math.min(scale, 0.95);
  }
  try {
    const engine = await getPdfEngine();
    const doc = await engine.open(file);
    try {
      await doc.renderPageToCanvas(canvas, {
        pageNumber: pageNum,
        scale: safeScale,
        intent: "thumbnail",
        dprCap: getRenderDprCap(mobile ? 1.25 : 2),
      });
    } finally {
      doc.destroy();
    }
    return await canvasToPreviewUrl(canvas, mobile ? 0.8 : 0.85);
  } catch (e) {
    if (safeScale > 0.45) {
      return renderPDFPage(file, pageNum, safeScale * 0.72);
    }
    void logDriverHealth({ library: "pdf_engine", phase: "thumbnail_render", ok: false, error: e });
    throw e;
  }
}

export async function getPDFPageCount(file: File): Promise<number> {
  try {
    const engine = await getPdfEngine();
    const doc = await engine.open(file);
    try {
      return doc.getPageCount();
    } finally {
      doc.destroy();
    }
  } catch (e) {
    void logDriverHealth({ library: "pdf_engine", phase: "page_count", ok: false, error: e });
    throw e;
  }
}

export async function renderAllPages(file: File, scale = 0.4): Promise<string[]> {
  const thumbs: string[] = [];
  const engine = await getPdfEngine();
  const doc = await engine.open(file);
  try {
    for (let i = 1; i <= doc.getPageCount(); i++) {
      const canvas = document.createElement("canvas");
      await doc.renderPageToCanvas(canvas, { pageNumber: i, scale, intent: "thumbnail", dprCap: 1.5 });
      thumbs.push(canvas.toDataURL("image/jpeg", 0.8));
    }
  } finally {
    doc.destroy();
  }
  return thumbs;
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
}

export default function PDFThumbnail({ file, pageNumber = 1, width = 120, className = "" }: PDFThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    setThumbnail(null);

    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      if (mounted.current) {
        setThumbnail(url);
        setLoading(false);
      }
      return () => {
        mounted.current = false;
        URL.revokeObjectURL(url);
      };
    }

    const scale = width / 210;
    renderPDFPage(file, pageNumber, Math.max(scale, 0.4))
      .then((url) => {
        if (mounted.current) {
          setThumbnail(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [file, pageNumber, width]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-xl animate-pulse ${className}`}
        style={{ width, height: Math.round(width * 1.414) }}
        data-testid="thumbnail-loading"
      />
    );
  }

  if (!thumbnail) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-xl ${className}`}
        style={{ width, height: Math.round(width * 1.414) }}
        data-testid="thumbnail-error"
      >
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt={`Page ${pageNumber} of ${file.name}`}
      className={`rounded-xl object-contain shadow-sm ${className}`}
      style={{ width, height: Math.round(width * 1.414), objectFit: "contain" }}
      data-testid="thumbnail-image"
    />
  );
}

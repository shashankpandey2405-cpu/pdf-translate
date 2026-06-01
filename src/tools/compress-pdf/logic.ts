import { compressPdfInWorker } from "@/lib/trustShield/pdfWorkerPool";

export type CompressionLevel = "extreme" | "recommended" | "less";

interface CompressOptions {
  level: CompressionLevel;
}

export async function compressPDF(file: File, options: CompressOptions): Promise<Uint8Array> {
  if (typeof window !== "undefined") {
    return compressPdfInWorker(file, options.level);
  }
  const { compressPdfBuffer } = await import("@/workers/tasks/compress");
  return compressPdfBuffer(await file.arrayBuffer(), options.level);
}

export function getQualityLabel(level: CompressionLevel): string {
  const labels: Record<CompressionLevel, string> = {
    extreme: "Extreme Compression",
    recommended: "Recommended",
    less: "Less Compression",
  };
  return labels[level];
}

export function getQualityDescription(level: CompressionLevel, mode: "browser" | "cloud" = "browser"): string {
  if (mode === "cloud") {
    const cloudDesc: Record<CompressionLevel, string> = {
      extreme: "Maximum size reduction via Ghostscript (best for image-heavy PDFs)",
      recommended: "Balanced compression with font and image optimization",
      less: "Light compression — preserves maximum visual quality",
    };
    return cloudDesc[level];
  }
  const desc: Record<CompressionLevel, string> = {
    extreme: "Light optimization in browser — use Cloud for real compression",
    recommended: "Metadata cleanup — use Cloud for image-heavy PDFs",
    less: "Minimal changes — use Cloud for significant size reduction",
  };
  return desc[level];
}

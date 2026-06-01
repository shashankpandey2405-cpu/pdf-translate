import type { PipelineStep } from "@/components/desktop/ProcessingPipeline";

export function pipelineFromProgress(labels: readonly string[], progress: number): PipelineStep[] {
  const safe = Math.min(100, Math.max(0, progress));
  const idx = Math.min(labels.length - 1, Math.floor((safe / 100) * labels.length));
  return labels.map((label, i) => ({
    id: `step-${i}`,
    label,
    status: i < idx ? "done" : i === idx ? "active" : "pending",
  }));
}

/** Default conversion / cloud pipeline stages */
export const DEFAULT_CONVERSION_PIPELINE = [
  "Uploading",
  "Analyzing document",
  "Detecting layout",
  "OCR processing",
  "Extracting tables",
  "Rebuilding structure",
  "Finalizing export",
] as const;

export const DEFAULT_COMPRESS_PIPELINE = [
  "Analyzing PDF",
  "Optimizing assets",
  "Compressing images",
  "Rebuilding structure",
  "Finalizing",
] as const;

export const DEFAULT_ORGANIZE_PIPELINE = [
  "Reading pages",
  "Processing structure",
  "Applying changes",
  "Optimizing output",
  "Finalizing",
] as const;

export const DEFAULT_AI_PIPELINE = [
  "Uploading",
  "Parsing document",
  "Running AI analysis",
  "Generating output",
  "Finalizing",
] as const;

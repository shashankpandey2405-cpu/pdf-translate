import type { CompressionLevel } from "@/tools/compress-pdf/logic";

/** Ghostscript PDFSETTINGS profile for Premium cloud compression. */
export type CloudCompressPreset = "screen" | "ebook" | "printer" | "prepress";

export const CLOUD_COMPRESS_PRESET_LABELS: Record<CloudCompressPreset, string> = {
  screen: "Maximum compression",
  ebook: "Recommended",
  printer: "High quality",
  prepress: "Print quality",
};

export function browserLevelToCloudPreset(level: CompressionLevel): CloudCompressPreset {
  switch (level) {
    case "extreme":
      return "screen";
    case "less":
      return "printer";
    case "recommended":
    default:
      return "ebook";
  }
}

export function cloudPresetForEnhancedJob(level: CompressionLevel): Record<string, unknown> {
  return { compressPreset: browserLevelToCloudPreset(level) };
}

/** User-facing download name: `{original}_{suffix}.{ext}` — never random UUIDs. */
export function deriveOutputFilename(
  originalName: string,
  suffix: string,
  extOverride?: string,
): string {
  const trimmed = (originalName || "document").trim();
  const dot = trimmed.lastIndexOf(".");
  const base = (dot > 0 ? trimmed.slice(0, dot) : trimmed).replace(/[^\w.\-()+\s]/g, "_") || "document";
  const ext =
    extOverride?.replace(/^\./, "") ??
    (dot > 0 ? trimmed.slice(dot + 1).replace(/[^\w]/g, "") : "pdf");
  const cleanSuffix = suffix.replace(/^_/, "").replace(/\s+/g, "_").replace(/[^\w-]/g, "_");
  return `${base}_${cleanSuffix}.${ext || "pdf"}`;
}

/** Parse original upload name from R2 input key: `.../jobId-filename.pdf` */
export function originalNameFromInputKey(inputKey: string | null | undefined): string | null {
  if (!inputKey) return null;
  const leaf = inputKey.split("/").pop() ?? "";
  const dash = leaf.indexOf("-");
  if (dash <= 0) return leaf || null;
  return leaf.slice(dash + 1) || null;
}

const TOOL_SUFFIX: Record<string, string> = {
  "chat-pdf": "chat",
  "ai-summarize": "summarized",
  "translate-pdf": "translated",
  "compress-pdf": "compressed",
  "pdf-to-word": "converted",
  "pdf-to-image": "images",
  "pdf-to-jpg": "jpg",
  "pdf-to-png": "png",
  "ocr-pdf": "ocr",
  "merge-pdf": "merged",
  "split-pdf": "split",
  "rotate-pdf": "rotated",
  "protect-pdf": "protected",
  "unlock-pdf": "unlocked",
  "word-to-pdf": "converted",
};

export function outputFilenameForTool(
  toolSlug: string,
  originalName: string,
  outputExt?: string,
): string {
  const suffix = TOOL_SUFFIX[toolSlug] ?? "pdftrusted";
  const ext =
    outputExt ??
    (toolSlug.includes("word") ? "docx" : toolSlug.includes("image") || toolSlug.includes("jpg") ? "zip" : "pdf");
  return deriveOutputFilename(originalName, suffix, ext);
}

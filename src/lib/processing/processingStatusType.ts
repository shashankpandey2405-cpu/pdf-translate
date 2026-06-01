export type ProcessingStatusType = "ai" | "cloud" | "instant";

const AI_SLUGS = new Set([
  "chat-pdf",
  "ai-summarize",
  "translate-pdf",
  "ocr-pdf",
  "smart-scan-ai",
  "ai-question-gen",
  "ai-scanner",
  "document-scanner",
]);

const INSTANT_SLUGS = new Set([
  "compress-pdf",
  "remove-pages",
  "delete-pages",
  "extract-pages",
  "rotate-pdf",
  "organize-pdf",
  "flatten-pdf",
  "unlock-pdf",
]);

/** Map tool slug → premium processing animation family. */
export function getProcessingStatusType(slug: string): ProcessingStatusType {
  const key = slug.replace(/^\/+/, "").split("/")[0] ?? slug;
  if (AI_SLUGS.has(key)) return "ai";
  if (INSTANT_SLUGS.has(key)) return "instant";
  return "cloud";
}

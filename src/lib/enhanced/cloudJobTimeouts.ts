/** Client poll deadlines — office/docx jobs need longer worker runtime. */
const HEAVY_CLOUD_TOOLS = new Set([
  "pdf-to-word",
  "word-to-pdf",
  "pdf-to-excel",
  "pptx-to-pdf",
  "ocr-pdf",
]);

/** AI jobs: allow time for Railway ping + OpenRouter cold start. */
const AI_CLOUD_TOOLS = new Set([
  "chat-pdf",
  "ai-summarize",
  "translate-pdf",
  "smart-scan-ai",
  "ai-question-gen",
]);

export function cloudPollDeadlineMs(toolSlug: string): number {
  if (AI_CLOUD_TOOLS.has(toolSlug)) return 15 * 60 * 1000;
  const minutes = HEAVY_CLOUD_TOOLS.has(toolSlug) ? 20 : 12;
  return minutes * 60 * 1000;
}

export function cloudQueuedTimeoutMs(toolSlug: string): number {
  if (AI_CLOUD_TOOLS.has(toolSlug)) return 150_000;
  return HEAVY_CLOUD_TOOLS.has(toolSlug) ? 120_000 : 90_000;
}

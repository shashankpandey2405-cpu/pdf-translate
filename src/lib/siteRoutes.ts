const LOCALES = new Set(["en", "hi", "zh", "ar", "es", "fr", "de"]);

/** Path segment after optional locale — e.g. /en/compress-pdf → compress-pdf */
export function primaryRouteSegment(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  if (LOCALES.has(parts[0]!) && parts.length > 1) return parts[1]!;
  return parts[0]!;
}

export function isHomePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return true;
  return parts.length === 1 && LOCALES.has(parts[0]!);
}

/** Tool workflow routes: hide header ads so upload area stays distraction-free. */
const TOOL_SEGMENTS = new Set([
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "pdf-to-word",
  "pdf-to-excel",
  "pdf-to-image",
  "pdf-to-png",
  "pdf-to-jpg",
  "pdf-to-pptx",
  "pdf-to-pdfa",
  "smart-scan-ai",
  "pdf-to-html",
  "pdf-editor",
  "edit-pdf",
  "sign-pdf",
  "unlock-pdf",
  "protect-pdf",
  "hard-lock-pdf",
  "redact-pdf",
  "ocr-pdf",
  "repair-pdf",
  "watermark-pdf",
  "rotate-pdf",
  "page-numbers",
  "word-to-pdf",
  "pptx-to-pdf",
  "pdf-maker",
  "translate-pdf",
  "ai-summarize",
  "chat-pdf",
  "flatten-pdf",
  "compare-pdf",
  "ai-question-gen",
  "extract-pages",
  "remove-pages",
  "organize-pdf",
  "resume-builder",
  "magic-eraser",
  "remove-watermark",
  "tools",
  "universal-converter",
  "document-scanner",
  "photo-resizer",
  "generate-qr-code",
  "download",
]);

export function isToolWorkflowPath(pathname: string): boolean {
  return TOOL_SEGMENTS.has(primaryRouteSegment(pathname));
}

/**
 * Static homepage grid — 12 tools only (LCP-critical, no runtime tool registry).
 * Slugs must match live routes in constants/tools.js.
 */
export const HOME_MASTER_TOOLS_ROW1 = [
  { slug: "compress-pdf", label: "PDF Compressor", routePath: "/compress-pdf" },
  { slug: "universal-converter", label: "PDF Converter", routePath: "/universal-converter" },
  { slug: "pdf-editor", label: "PDF Editor", routePath: "/pdf-editor" },
  { slug: "tools/ai-scanner", label: "AI PDF Scanner", routePath: "/tools/ai-scanner" },
  { slug: "sign-pdf", label: "Sign PDF", routePath: "/sign-pdf" },
  { slug: "merge-pdf", label: "Merge PDF", routePath: "/merge-pdf" },
];

export const HOME_MASTER_TOOLS_ROW2 = [
  { slug: "split-pdf", label: "Split PDF", routePath: "/split-pdf" },
  { slug: "ocr-pdf", label: "OCR Extract Text", routePath: "/ocr-pdf" },
  { slug: "remove-watermark", label: "Watermark Remover", routePath: "/remove-watermark" },
  { slug: "translate-pdf", label: "Translate PDF", routePath: "/translate-pdf" },
  { slug: "photo-resizer", label: "Resize Image PDF", routePath: "/photo-resizer" },
  { slug: "repair-pdf", label: "PDF Repair", routePath: "/repair-pdf" },
];

export const HOME_MASTER_TOOLS = [...HOME_MASTER_TOOLS_ROW1, ...HOME_MASTER_TOOLS_ROW2];

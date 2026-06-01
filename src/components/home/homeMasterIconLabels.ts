/** SSR-safe tool glyphs (no lucide — server components must not import client icon libs). */
const LABEL_BY_SLUG: Record<string, string> = {
  "compress-pdf": "↓",
  "universal-converter": "⇄",
  "pdf-editor": "✎",
  "tools/ai-scanner": "◎",
  "sign-pdf": "✒",
  "merge-pdf": "⊕",
  "split-pdf": "✂",
  "ocr-pdf": "A",
  "remove-watermark": "⌫",
  "translate-pdf": "文",
  "photo-resizer": "▣",
  "repair-pdf": "⚙",
};

export function homeMasterIconLabel(slug: string): string {
  return LABEL_BY_SLUG[slug] ?? "PDF";
}

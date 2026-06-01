/**
 * Home page tool grid — hero live tools only (trust + focus).
 */
import { HERO_TOOL_SLUGS } from "./toolStatus.js";

const HERO_SET = new Set(HERO_TOOL_SLUGS);

function heroLive(slugs) {
  return slugs.filter((s) => HERO_SET.has(s));
}

/** Bento cell sizes for featured home tools */
export const HOME_BENTO_SIZES = {
  "pdf-editor": "large",
  "compress-pdf": "wide",
  "merge-pdf": "wide",
  "resume-builder": "tall",
  "universal-converter": "large",
};

/** @type {Record<string, "large" | "wide" | "tall" | "default">} */
export const HOME_BENTO_SIZES_MAP = HOME_BENTO_SIZES;

export const HOME_TOOL_LABEL_OVERRIDES = {
  "pdf-editor": "Organize PDF",
  "pdf-to-html": "PDF to Text",
  "pdf-maker": "HTML to PDF",
  "pptx-to-pdf": "PPT to PDF",
  "pdf-to-pptx": "PDF to PPT",
  "protect-pdf": "Protect PDF (Lock)",
  "hard-lock-pdf": "Hard Lock PDF",
  "remove-watermark": "Remove Watermark",
  "universal-converter": "Universal Converter",
};

/** @type {{ key: string; title: string; featured?: boolean; slugs: string[] }[]} */
export const HOME_TOOL_CATEGORIES = [
  {
    key: "editOptimize",
    title: "Edit & Optimize",
    slugs: heroLive(["merge-pdf", "split-pdf", "compress-pdf", "ocr-pdf", "redact-pdf", "pdf-editor"]),
  },
  {
    key: "convertToPdf",
    title: "Convert to PDF",
    slugs: heroLive(["word-to-pdf", "universal-converter"]),
  },
  {
    key: "convertFromPdf",
    title: "Convert from PDF",
    slugs: heroLive(["pdf-to-word", "pdf-to-image"]),
  },
  {
    key: "securitySign",
    title: "Security & Sign",
    slugs: heroLive(["protect-pdf", "unlock-pdf", "sign-pdf"]),
  },
  {
    key: "studentEssentials",
    title: "Student Essentials",
    featured: true,
    slugs: heroLive(["document-scanner"]),
  },
];

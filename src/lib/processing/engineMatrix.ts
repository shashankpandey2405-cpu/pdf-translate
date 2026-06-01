/**
 * Canonical browser vs cloud engine map — OSS only, no paid APIs.
 * Aligns product UI with backend-service worker pools (GitHub: backend-service).
 */

import type { ProcessingTier, WorkerPool } from "@/lib/processing/toolProfiles";

export type OssProject =
  | "pdf-lib"
  | "pdfjs"
  | "mupdf-wasm"
  | "jspdf"
  | "opencv-js"
  | "ghostscript"
  | "qpdf"
  | "ocrmypdf"
  | "tesseract"
  | "unpaper"
  | "pngquant"
  | "paddleocr"
  | "opencv-python"
  | "pdf2docx"
  | "libreoffice"
  | "pdfplumber"
  | "camelot"
  | "openpyxl"
  | "pymupdf"
  | "pikepdf";

export type ToolEngineSpec = {
  slug: string;
  tier: ProcessingTier;
  workerPool?: WorkerPool;
  supportsCloud: boolean;
  /** Best path on device — privacy & instant */
  browser: {
    engine: string;
    stack: OssProject[];
    qualityNote?: string;
  } | null;
  /** Best path on Railway workers — quality & heavy CPU */
  cloud: {
    engine: string;
    stack: OssProject[];
    qualityNote?: string;
    dockerBuildArgs?: string[];
  } | null;
  /** Stirling-PDF module analogy (reference only — we do not fork Stirling) */
  stirlingAnalog?: string;
};

const GS_QPDF: OssProject[] = ["ghostscript", "qpdf"];
const OCR_STACK: OssProject[] = ["ocrmypdf", "tesseract", "unpaper", "pngquant", "opencv-python"];
const DOCX_STACK: OssProject[] = ["pdf2docx", "libreoffice", "ocrmypdf", "tesseract"];
const EXCEL_STACK: OssProject[] = ["pdfplumber", "openpyxl", "camelot", "ocrmypdf"];
const OFFICE_STACK: OssProject[] = ["libreoffice"];
const SECURITY_STACK: OssProject[] = ["qpdf", "pymupdf"];
const CONVERT_STACK: OssProject[] = ["pymupdf"];

/** Tools with explicit engine routing (others default to browser-only pdf-lib/pdf.js). */
export const TOOL_ENGINE_MATRIX: Record<string, ToolEngineSpec> = {
  "merge-pdf": {
    slug: "merge-pdf",
    tier: "browser_only",
    supportsCloud: false,
    browser: { engine: "pdf-lib + Web Worker", stack: ["pdf-lib", "pdfjs"] },
    cloud: null,
    stirlingAnalog: "merge",
  },
  "split-pdf": {
    slug: "split-pdf",
    tier: "browser_only",
    supportsCloud: false,
    browser: { engine: "pdf-lib", stack: ["pdf-lib"] },
    cloud: null,
    stirlingAnalog: "split",
  },
  "compress-pdf": {
    slug: "compress-pdf",
    tier: "hybrid",
    workerPool: "compress",
    supportsCloud: true,
    browser: {
      engine: "pdf-lib (metadata / light optimize)",
      stack: ["pdf-lib"],
      qualityNote: "Honest limits — not Ghostscript-level compression in browser.",
    },
    cloud: {
      engine: "Ghostscript + qpdf linearize",
      stack: GS_QPDF,
      qualityNote: "Production compression — recommended for large files.",
    },
    stirlingAnalog: "compress",
  },
  "ocr-pdf": {
    slug: "ocr-pdf",
    tier: "cloud_only",
    workerPool: "ocr",
    supportsCloud: true,
    browser: null,
    cloud: {
      engine: "OCRmyPDF + Tesseract (Ultra: PaddleOCR)",
      stack: [...OCR_STACK, "paddleocr"],
      qualityNote: "Requires worker; browser OCR disabled for quality.",
      dockerBuildArgs: ["ENABLE_PADDLE_OCR=1"],
    },
    stirlingAnalog: "ocr",
  },
  "pdf-to-word": {
    slug: "pdf-to-word",
    tier: "hybrid",
    workerPool: "docx",
    supportsCloud: true,
    browser: {
      engine: "pdf.js → RTF export",
      stack: ["pdfjs"],
      qualityNote: "Text extraction only — not full layout.",
    },
    cloud: {
      engine: "pdf2docx + LibreOffice + OCR preflight",
      stack: DOCX_STACK,
      qualityNote: "Best for scans and complex layouts.",
    },
    stirlingAnalog: "pdf-to-word",
  },
  "pdf-to-excel": {
    slug: "pdf-to-excel",
    tier: "hybrid",
    workerPool: "excel",
    supportsCloud: true,
    browser: {
      engine: "pdf.js heuristic → XLSX",
      stack: ["pdfjs", "openpyxl"],
      qualityNote: "Simple tables only.",
    },
    cloud: {
      engine: "pdfplumber + Camelot + openpyxl",
      stack: EXCEL_STACK,
      qualityNote: "Financial / multi-page tables.",
      dockerBuildArgs: ["ENABLE_CAMELOT=1"],
    },
    stirlingAnalog: "pdf-to-excel",
  },
  "word-to-pdf": {
    slug: "word-to-pdf",
    tier: "cloud_only",
    workerPool: "office",
    supportsCloud: true,
    browser: null,
    cloud: { engine: "LibreOffice headless", stack: OFFICE_STACK },
    stirlingAnalog: "word-to-pdf",
  },
  "pptx-to-pdf": {
    slug: "pptx-to-pdf",
    tier: "cloud_only",
    workerPool: "office",
    supportsCloud: true,
    browser: null,
    cloud: { engine: "LibreOffice Impress", stack: OFFICE_STACK },
    stirlingAnalog: "pptx-to-pdf",
  },
  "protect-pdf": {
    slug: "protect-pdf",
    tier: "hybrid",
    workerPool: "security",
    supportsCloud: true,
    browser: {
      engine: "pdf-lib (PDFTrusted AES package)",
      stack: ["pdf-lib"],
      qualityNote: "Not Acrobat-compatible encryption.",
    },
    cloud: { engine: "qpdf 256-bit AES", stack: SECURITY_STACK, qualityNote: "Standard PDF passwords." },
    stirlingAnalog: "add-password",
  },
  "unlock-pdf": {
    slug: "unlock-pdf",
    tier: "hybrid",
    workerPool: "security",
    supportsCloud: true,
    browser: { engine: "pdf-lib (limited)", stack: ["pdf-lib"] },
    cloud: { engine: "qpdf decrypt", stack: ["qpdf"] },
    stirlingAnalog: "remove-password",
  },
  "redact-pdf": {
    slug: "redact-pdf",
    tier: "hybrid",
    workerPool: "security",
    supportsCloud: true,
    browser: {
      engine: "pdf-lib overlay",
      stack: ["pdf-lib", "pdfjs"],
      qualityNote: "Visual blackout — not forensic redaction.",
    },
    cloud: {
      engine: "PyMuPDF true redaction",
      stack: SECURITY_STACK,
      qualityNote: "Removes text objects under black boxes.",
    },
    stirlingAnalog: "redact",
  },
  "pdf-editor": {
    slug: "pdf-editor",
    tier: "browser_only",
    supportsCloud: false,
    browser: { engine: "pdf-lib + pdf.js canvas", stack: ["pdf-lib", "pdfjs"] },
    cloud: null,
    stirlingAnalog: "view-pdf / annotate",
  },
  "pdf-to-image": {
    slug: "pdf-to-image",
    tier: "hybrid",
    workerPool: "convert",
    supportsCloud: true,
    browser: { engine: "pdf.js render → PNG/JPG ZIP", stack: ["pdfjs"] },
    cloud: {
      engine: "PyMuPDF render → ZIP",
      stack: CONVERT_STACK,
      qualityNote: "Higher DPI, consistent color on Railway.",
    },
    stirlingAnalog: "pdf-to-image",
  },
  "pdf-to-jpg": {
    slug: "pdf-to-jpg",
    tier: "hybrid",
    workerPool: "convert",
    supportsCloud: true,
    browser: { engine: "pdf.js render → JPG ZIP", stack: ["pdfjs"] },
    cloud: {
      engine: "PyMuPDF render → JPG ZIP",
      stack: CONVERT_STACK,
      qualityNote: "Higher DPI JPEG export on Railway.",
    },
    stirlingAnalog: "pdf-to-image",
  },
  "pdf-to-png": {
    slug: "pdf-to-png",
    tier: "hybrid",
    workerPool: "convert",
    supportsCloud: true,
    browser: { engine: "pdf.js render → PNG ZIP", stack: ["pdfjs"] },
    cloud: {
      engine: "PyMuPDF render → PNG ZIP",
      stack: CONVERT_STACK,
      qualityNote: "Lossless PNG per page on Railway.",
    },
    stirlingAnalog: "pdf-to-image",
  },
  "pdf-to-pptx": {
    slug: "pdf-to-pptx",
    tier: "cloud_only",
    workerPool: "convert",
    supportsCloud: true,
    browser: null,
    cloud: {
      engine: "PyMuPDF slides + python-pptx",
      stack: CONVERT_STACK,
      qualityNote: "Each PDF page becomes a full-slide image with text overlay.",
    },
    stirlingAnalog: "pdf-to-pptx",
  },
  "pdf-to-pdfa": {
    slug: "pdf-to-pdfa",
    tier: "browser_first",
    workerPool: "convert",
    supportsCloud: true,
    browser: {
      engine: "pdf-lib + XMP metadata injection",
      stack: ["pdf-lib"] as OssProject[],
      qualityNote:
        "Adds PDF/A XMP metadata, output intent, and sRGB ICC profile. Supports 1b/2b/3b.",
    },
    cloud: {
      engine: "Ghostscript PDF/A + ICC sRGB",
      stack: ["ghostscript"] as OssProject[],
      qualityNote:
        "Full Ghostscript re-distillation to PDF/A with font embedding and ICC profile.",
    },
    stirlingAnalog: undefined,
  },
  "repair-pdf": {
    slug: "repair-pdf",
    tier: "browser_only",
    supportsCloud: false,
    browser: { engine: "pdf-lib + MuPDF WASM fallback", stack: ["pdf-lib", "mupdf-wasm"] },
    cloud: null,
  },
};

const DEFAULT_BROWSER: ToolEngineSpec = {
  slug: "_default",
  tier: "browser_only",
  supportsCloud: false,
  browser: { engine: "pdf-lib / pdf.js", stack: ["pdf-lib", "pdfjs"] },
  cloud: null,
};

export function getToolEngineSpec(slug: string): ToolEngineSpec {
  return TOOL_ENGINE_MATRIX[slug] ?? { ...DEFAULT_BROWSER, slug };
}

export function getBrowserEngineLabel(slug: string): string | null {
  return getToolEngineSpec(slug).browser?.engine ?? null;
}

export function getCloudEngineLabel(slug: string): string | null {
  return getToolEngineSpec(slug).cloud?.engine ?? null;
}

export function listOssStackForSlug(slug: string): OssProject[] {
  const spec = getToolEngineSpec(slug);
  const set = new Set<OssProject>([...(spec.browser?.stack ?? []), ...(spec.cloud?.stack ?? [])]);
  return [...set];
}

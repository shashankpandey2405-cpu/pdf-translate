import { getToolHref } from "../../../constants/tools";
import type { MasterToolStage } from "@/lib/desktop/types";
import {
  DEFAULT_AI_PIPELINE,
  DEFAULT_COMPRESS_PIPELINE,
  DEFAULT_CONVERSION_PIPELINE,
  DEFAULT_ORGANIZE_PIPELINE,
} from "@/lib/desktop/pipelineFromProgress";

export type DesktopNextAction = {
  label: string;
  href: string;
  slug: string;
};

export type DesktopToolMeta = {
  slug: string;
  title: string;
  subtitle: string;
  categoryLabel: string;
  accept: string;
  uploadLabel: string;
  uploadSublabel: string;
  pipelineSteps: readonly string[];
  premiumFeatures: string[];
  freeActionLabel: string;
  premiumActionLabel: string;
  doneTitle: string;
  nextActions: DesktopNextAction[];
};

function meta(
  slug: string,
  title: string,
  subtitle: string,
  categoryLabel: string,
  opts?: Partial<Omit<DesktopToolMeta, "slug" | "title" | "subtitle" | "categoryLabel">>,
): DesktopToolMeta {
  return {
    slug,
    title,
    subtitle,
    categoryLabel,
    accept: opts?.accept ?? ".pdf,application/pdf",
    uploadLabel: opts?.uploadLabel ?? "Drop your PDF here",
    uploadSublabel: opts?.uploadSublabel ?? "or choose a file",
    pipelineSteps: opts?.pipelineSteps ?? DEFAULT_CONVERSION_PIPELINE,
    premiumFeatures: opts?.premiumFeatures ?? [
      "OCR enhancement for scans",
      "AI layout preservation",
      "Smart image optimization",
      "Table & multilingual retention",
    ],
    freeActionLabel: opts?.freeActionLabel ?? "Start processing",
    premiumActionLabel: opts?.premiumActionLabel ?? "Run Premium",
    doneTitle: opts?.doneTitle ?? "Processing complete",
    nextActions: opts?.nextActions ?? defaultNextActions(slug),
  };
}

function defaultNextActions(currentSlug: string): DesktopNextAction[] {
  const all: DesktopNextAction[] = [
    { slug: "pdf-editor", label: "Edit this PDF", href: getToolHref({ slug: "pdf-editor", routePath: "/pdf-editor" }) },
    { slug: "merge-pdf", label: "Merge with another file", href: getToolHref({ slug: "merge-pdf" }) },
    { slug: "translate-pdf", label: "Translate PDF", href: getToolHref({ slug: "translate-pdf" }) },
    { slug: "ai-summarize", label: "Summarize document", href: getToolHref({ slug: "ai-summarize" }) },
    { slug: "sign-pdf", label: "Sign document", href: getToolHref({ slug: "sign-pdf", routePath: "/sign-pdf" }) },
    { slug: "compress-pdf", label: "Compress further", href: getToolHref({ slug: "compress-pdf" }) },
    { slug: "pdf-to-word", label: "Convert to Word", href: getToolHref({ slug: "pdf-to-word" }) },
  ];
  return all.filter((a) => a.slug !== currentSlug).slice(0, 6);
}

const REGISTRY: Record<string, DesktopToolMeta> = {
  "compress-pdf": meta(
    "compress-pdf",
    "Compress PDF",
    "Reduce file size while keeping quality — browser or Premium cloud.",
    "Compress",
    {
      pipelineSteps: DEFAULT_COMPRESS_PIPELINE,
      freeActionLabel: "Start Compression",
      premiumActionLabel: "AI + OCR Compression",
      doneTitle: "Compression complete",
      premiumFeatures: [
        "OCR enhancement for scans",
        "Scanned PDF optimization",
        "AI layout preservation",
        "Table retention & multilingual support",
      ],
    },
  ),
  "converter-hub": meta(
    "converter-hub",
    "PDF Converter",
    "Upload your file once, then choose Word, Excel, image, or other outputs.",
    "Converter",
    {
      uploadLabel: "Drop your file here",
      uploadSublabel: "PDF, Word, Excel, or images",
      accept: ".pdf,application/pdf,.doc,.docx,.xls,.xlsx,image/*",
      freeActionLabel: "Choose format",
    },
  ),
  "pdf-to-word": meta(
    "pdf-to-word",
    "PDF to Word",
    "Convert PDFs into editable Word documents instantly.",
    "Converter",
    {
      freeActionLabel: "Convert in Browser",
      premiumActionLabel: "Premium OCR Convert",
      doneTitle: "Conversion complete",
      premiumFeatures: [
        "OCR for scanned pages",
        "Preserve layout & tables",
        "AI formatting cleanup",
        "Multilingual detection",
      ],
    },
  ),
  "pdf-to-excel": meta("pdf-to-excel", "PDF to Excel", "Extract tables and data into spreadsheets.", "Converter"),
  "pdf-to-pptx": meta("pdf-to-pptx", "PDF to PowerPoint", "Turn PDF slides into editable presentations.", "Converter"),
  "chat-pdf": meta(
    "chat-pdf",
    "Chat with PDF",
    "Ask questions about your PDF and get AI-powered answers from the document.",
    "AI PDF",
    {
      premiumFeatures: [
        "AI-powered document Q&A",
        "Smart suggested questions",
        "Large document support",
        "Context-aware answers",
      ],
    },
  ),
  "smart-scan-ai": meta(
    "smart-scan-ai",
    "Smart Scan AI",
    "AI Document Reconstruction — turn any photo, scan, or screenshot into a clean professional PDF.",
    "AI PDF",
    {
      premiumFeatures: [
        "Vision AI document analysis",
        "Layout & table reconstruction",
        "Handwriting recognition",
        "Professional PDF output",
      ],
    },
  ),
  "pdf-to-pdfa": meta(
    "pdf-to-pdfa",
    "PDF to PDF/A",
    "Convert PDF to ISO archival format for government compliance and long-term preservation.",
    "Converter",
    {
      premiumFeatures: [
        "PDF/A-1b, 2b, 3b conformance",
        "XMP metadata embedding",
        "sRGB color profile injection",
        "Government & legal compliance",
      ],
    },
  ),
  "pdf-to-image": meta(
    "pdf-to-image",
    "PDF to Image",
    "Export pages as high-quality images.",
    "Converter",
    { accept: ".pdf,application/pdf", uploadSublabel: "PDF only — choose pages after upload" },
  ),
  "word-to-pdf": meta(
    "word-to-pdf",
    "Word to PDF",
    "Create PDFs from Word documents.",
    "Converter",
    {
      accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadLabel: "Drop your document here",
      uploadSublabel: "DOC or DOCX",
    },
  ),
  "excel-to-pdf": meta(
    "excel-to-pdf",
    "Excel to PDF",
    "Convert spreadsheets to PDF.",
    "Converter",
    {
      accept: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      uploadLabel: "Drop your spreadsheet here",
    },
  ),
  "jpg-to-pdf": meta(
    "jpg-to-pdf",
    "Image to PDF",
    "Combine images into a single PDF.",
    "Converter",
    {
      accept: "image/*,.jpg,.jpeg,.png,.webp",
      uploadLabel: "Drop your images here",
      uploadSublabel: "JPG, PNG, or WebP",
    },
  ),
  "merge-pdf": meta(
    "merge-pdf",
    "Merge PDF",
    "Combine multiple PDFs into one document.",
    "Organize",
    {
      pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
      accept: ".pdf,application/pdf",
      uploadLabel: "Drop PDFs here",
      uploadSublabel: "Select multiple files",
      freeActionLabel: "Merge files",
    },
  ),
  "split-pdf": meta("split-pdf", "Split PDF", "Divide a PDF into separate files.", "Organize", {
    pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
    freeActionLabel: "Split PDF",
  }),
  "rotate-pdf": meta("rotate-pdf", "Rotate PDF", "Rotate pages in your document.", "Organize", {
    pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
    freeActionLabel: "Apply rotation",
  }),
  "extract-pages": meta("extract-pages", "Extract Pages", "Pull selected pages into a new PDF.", "Organize", {
    pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
  }),
  "remove-pages": meta("remove-pages", "Delete Pages", "Remove unwanted pages from your PDF.", "Organize", {
    pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
  }),
  "organize-pdf": meta("organize-pdf", "Reorder Pages", "Drag and drop to reorder PDF pages.", "Organize", {
    pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
  }),
  "watermark-pdf": meta("watermark-pdf", "Watermark PDF", "Add text or image watermarks.", "Edit", {
    pipelineSteps: DEFAULT_ORGANIZE_PIPELINE,
  }),
  "page-numbers": meta("page-numbers", "Page Numbers", "Add page numbers to your document.", "Edit"),
  "flatten-pdf": meta("flatten-pdf", "Flatten PDF", "Flatten form fields and annotations into static content.", "Edit"),
  "compare-pdf": meta("compare-pdf", "Compare PDF", "Compare two PDFs side by side and highlight differences.", "Edit"),
  "ai-question-gen": meta(
    "ai-question-gen",
    "AI Question Generator",
    "Generate MCQs, True/False, and short answer questions from your PDF using AI.",
    "AI PDF",
    {
      pipelineSteps: DEFAULT_AI_PIPELINE,
      premiumFeatures: [
        "Multiple question types (MCQ, T/F, Short Answer, Fill-in-Blank)",
        "Configurable difficulty levels",
        "AI-generated explanations",
        "Export as text file",
      ],
    },
  ),
  "redact-pdf": meta("redact-pdf", "Redact PDF", "Permanently remove sensitive content.", "Edit"),
  "repair-pdf": meta("repair-pdf", "Repair PDF", "Fix corrupted or broken PDF files.", "Edit"),
  "unlock-pdf": meta("unlock-pdf", "Unlock PDF", "Remove password protection.", "Sign"),
  "protect-pdf": meta("protect-pdf", "Protect PDF", "Add password encryption.", "Sign"),
  "ocr-pdf": meta("ocr-pdf", "OCR PDF", "Make scanned PDFs searchable and editable.", "AI PDF", {
    pipelineSteps: DEFAULT_AI_PIPELINE,
    premiumActionLabel: "Run OCR",
  }),
  "translate-pdf": meta("translate-pdf", "Translate PDF", "Translate document content with AI.", "AI PDF", {
    pipelineSteps: DEFAULT_AI_PIPELINE,
    uploadSublabel: "PDF for AI translation",
  }),
  "ai-summarize": meta("ai-summarize", "Summarize PDF", "AI-powered summary of your document.", "AI PDF", {
    pipelineSteps: DEFAULT_AI_PIPELINE,
    freeActionLabel: "Summarize",
    premiumActionLabel: "Premium AI Summary",
  }),
  "ai-scanner": meta(
    "ai-scanner",
    "Document Scanner",
    "Photo-to-scan with perspective correction in your browser.",
    "AI PDF",
    {
      accept: "image/jpeg,image/png,image/webp,image/*",
      uploadLabel: "Drop a photo of your document",
      uploadSublabel: "JPG, PNG, or WebP — processed locally",
      freeActionLabel: "Run scan",
      doneTitle: "Scan complete",
    },
  ),
};

export function getToolDesktopMeta(slug: string): DesktopToolMeta {
  return (
    REGISTRY[slug] ??
    meta(
      slug,
      slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      "Secure, fast PDF processing in your browser or the cloud.",
      "Tools",
    )
  );
}

export function shouldShowDesktopRightPanel(stage: MasterToolStage, hasFile: boolean): boolean {
  return hasFile && stage !== "upload";
}

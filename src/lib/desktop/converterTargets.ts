import { getToolHref } from "../../../constants/tools";

export type ConverterTarget = {
  slug: string;
  label: string;
  href: string;
  description?: string;
};

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isWord(file: File): boolean {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".docx") ||
    n.endsWith(".doc") ||
    file.type.includes("wordprocessingml") ||
    file.type === "application/msword"
  );
}

function isExcel(file: File): boolean {
  const n = file.name.toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".xls") || file.type.includes("spreadsheet");
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(file.name);
}

/** Conversion destinations shown after upload on the converter hub (by file type). */
export function getConverterTargetsForFile(file: File): ConverterTarget[] {
  if (isPdf(file)) {
    return [
      { slug: "pdf-to-word", label: "PDF to Word", href: getToolHref({ slug: "pdf-to-word" }), description: "Editable DOCX" },
      { slug: "pdf-to-excel", label: "PDF to Excel", href: getToolHref({ slug: "pdf-to-excel" }), description: "Spreadsheet export" },
      { slug: "pdf-to-pptx", label: "PDF to PowerPoint", href: getToolHref({ slug: "pdf-to-pptx" }), description: "Slides" },
      { slug: "pdf-to-pdfa", label: "PDF to PDF/A", href: getToolHref({ slug: "pdf-to-pdfa" }), description: "ISO archival" },
      { slug: "pdf-to-image", label: "PDF to Image", href: getToolHref({ slug: "pdf-to-image" }), description: "PNG / JPG pages" },
      { slug: "compress-pdf", label: "Compress PDF", href: getToolHref({ slug: "compress-pdf" }), description: "Smaller file size" },
      { slug: "ocr-pdf", label: "OCR PDF", href: getToolHref({ slug: "ocr-pdf" }), description: "Searchable text" },
      { slug: "translate-pdf", label: "Translate PDF", href: getToolHref({ slug: "translate-pdf" }), description: "AI translation" },
      { slug: "ai-summarize", label: "Summarize PDF", href: getToolHref({ slug: "ai-summarize" }), description: "AI summary" },
    ];
  }
  if (isWord(file)) {
    return [
      { slug: "word-to-pdf", label: "Word to PDF", href: getToolHref({ slug: "word-to-pdf" }), description: "Create PDF" },
    ];
  }
  if (isExcel(file)) {
    return [
      { slug: "excel-to-pdf", label: "Excel to PDF", href: getToolHref({ slug: "excel-to-pdf" }), description: "Create PDF" },
    ];
  }
  if (isImage(file)) {
    return [
      { slug: "jpg-to-pdf", label: "Image to PDF", href: getToolHref({ slug: "jpg-to-pdf" }), description: "Combine to PDF" },
    ];
  }
  return [
    {
      slug: "universal-converter",
      label: "Universal Converter",
      href: getToolHref({ slug: "universal-converter", routePath: "/universal-converter" }),
      description: "More formats",
    },
  ];
}

import { getToolHref } from "../../../constants/tools";
import type { LucideIcon } from "lucide-react";
import { Minimize2, RefreshCw, GitMerge, PenLine, Stamp, Sparkles, MoreHorizontal } from "lucide-react";

export type DesktopNavTool = {
  slug: string;
  label: string;
  href: string;
  description?: string;
};

export type DesktopNavCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Primary route when clicking category label */
  primaryHref: string;
  tools: DesktopNavTool[];
};

function href(slug: string, routePath?: string) {
  return getToolHref({ slug, routePath });
}

/** Desktop mega-menu structure — maps to live PDFTrusted tools. */
export const DESKTOP_NAV_CATEGORIES: DesktopNavCategory[] = [
  {
    id: "compress",
    label: "Compress",
    icon: Minimize2,
    primaryHref: href("compress-pdf"),
    tools: [{ slug: "compress-pdf", label: "Compress PDF", href: href("compress-pdf") }],
  },
  {
    id: "converter",
    label: "Converter",
    icon: RefreshCw,
    primaryHref: "/converter",
    tools: [
      { slug: "pdf-to-word", label: "PDF to Word", href: href("pdf-to-word") },
      { slug: "pdf-to-excel", label: "PDF to Excel", href: href("pdf-to-excel") },
      { slug: "pdf-to-pptx", label: "PDF to PowerPoint", href: href("pdf-to-pptx") },
      { slug: "pdf-to-pdfa", label: "PDF to PDF/A", href: href("pdf-to-pdfa") },
      { slug: "pdf-to-image", label: "PDF to Image", href: href("pdf-to-image") },
      { slug: "word-to-pdf", label: "Word to PDF", href: href("word-to-pdf") },
      { slug: "excel-to-pdf", label: "Excel to PDF", href: href("excel-to-pdf") },
      { slug: "jpg-to-pdf", label: "Image to PDF", href: href("jpg-to-pdf") },
      { slug: "universal-converter", label: "Universal Converter", href: href("universal-converter", "/universal-converter") },
    ],
  },
  {
    id: "organize",
    label: "Organize",
    icon: GitMerge,
    primaryHref: href("merge-pdf"),
    tools: [
      { slug: "merge-pdf", label: "Merge PDF", href: href("merge-pdf") },
      { slug: "split-pdf", label: "Split PDF", href: href("split-pdf") },
      { slug: "rotate-pdf", label: "Rotate PDF", href: href("rotate-pdf") },
      { slug: "remove-pages", label: "Delete Pages", href: href("remove-pages") },
      { slug: "extract-pages", label: "Extract Pages", href: href("extract-pages") },
      { slug: "organize-pdf", label: "Reorder Pages", href: href("organize-pdf") },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    icon: PenLine,
    primaryHref: href("pdf-editor", "/pdf-editor"),
    tools: [
      { slug: "pdf-editor", label: "PDF Editor", href: href("pdf-editor", "/pdf-editor") },
      { slug: "watermark-pdf", label: "Watermark", href: href("watermark-pdf") },
      { slug: "page-numbers", label: "Page Numbers", href: href("page-numbers") },
      { slug: "flatten-pdf", label: "Flatten PDF", href: href("flatten-pdf") },
      { slug: "compare-pdf", label: "Compare PDF", href: href("compare-pdf") },
      { slug: "redact-pdf", label: "Redact PDF", href: href("redact-pdf") },
      { slug: "repair-pdf", label: "Repair PDF", href: href("repair-pdf") },
    ],
  },
  {
    id: "sign",
    label: "Sign",
    icon: Stamp,
    primaryHref: href("sign-pdf", "/sign-pdf"),
    tools: [
      { slug: "sign-pdf", label: "Sign PDF", href: href("sign-pdf", "/sign-pdf") },
      { slug: "protect-pdf", label: "Protect PDF", href: href("protect-pdf") },
      { slug: "unlock-pdf", label: "Unlock PDF", href: href("unlock-pdf") },
      { slug: "hard-lock-pdf", label: "Hard Lock PDF", href: href("hard-lock-pdf") },
    ],
  },
  {
    id: "ai",
    label: "AI PDF",
    icon: Sparkles,
    primaryHref: href("ai-summarize"),
    tools: [
      { slug: "ai-summarize", label: "PDF Summary", href: href("ai-summarize") },
      { slug: "translate-pdf", label: "Translate PDF", href: href("translate-pdf") },
      { slug: "chat-pdf", label: "Chat with PDF", href: href("chat-pdf") },
      { slug: "smart-scan-ai", label: "Smart Scan AI", href: href("smart-scan-ai") },
      { slug: "ocr-pdf", label: "OCR PDF", href: href("ocr-pdf") },
      { slug: "ai-question-gen", label: "AI Question Generator", href: href("ai-question-gen") },
      { slug: "ai-scanner", label: "AI Scanner", href: href("ai-scanner", "/tools/ai-scanner") },
      { slug: "pdf-to-excel", label: "Table Extraction", href: href("pdf-to-excel") },
    ],
  },
  {
    id: "more",
    label: "All tools",
    icon: MoreHorizontal,
    primaryHref: "/all-tools",
    tools: [
      { slug: "all-tools", label: "All tools", href: "/all-tools" },
      { slug: "pricing", label: "Pricing", href: "/pricing" },
      { slug: "document-scanner", label: "Document Scanner", href: href("document-scanner", "/document-scanner") },
      { slug: "resume-builder", label: "Resume Builder", href: href("resume-builder", "/resume-builder") },
    ],
  },
];

export function categoryForPath(pathname: string): string | null {
  const seg = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "").split("/").filter(Boolean)[0] ?? "";
  const path = `/${seg}`;
  for (const cat of DESKTOP_NAV_CATEGORIES) {
    if (cat.tools.some((t) => t.href === path || t.href.endsWith(path))) return cat.id;
    if (cat.primaryHref === path) return cat.id;
  }
  if (path.includes("compress")) return "compress";
  if (path === "/converter" || path.startsWith("/converter/")) return "converter";
  return null;
}

export function slugFromPath(pathname: string): string | null {
  const clean = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const match = DESKTOP_NAV_CATEGORIES.flatMap((c) => c.tools).find(
    (t) => t.href === clean || clean.startsWith(t.href),
  );
  return match?.slug ?? null;
}

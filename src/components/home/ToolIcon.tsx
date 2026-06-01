import { memo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  FileText,
  FileUser,
  GitMerge,
  Hash,
  Image,
  ImageDown,
  Lock,
  Minimize2,
  PenLine,
  QrCode,
  RefreshCw,
  ScanLine,
  Scissors,
  Shield,
  ShieldCheck,
  Stamp,
  Table,
  Unlock,
  Wand2,
  FileArchive,
  FileUp,
  FormInput,
  GitCompareArrows,
  GraduationCap,
  Languages,
  Eraser,
  Sparkles,
  Layers,
  MessageSquare,
  Globe,
  BookOpen,
} from "lucide-react";

const SLUG_ICONS: Record<string, LucideIcon> = {
  "merge-pdf": GitMerge,
  "split-pdf": Scissors,
  "compress-pdf": Minimize2,
  "repair-pdf": RefreshCw,
  "rotate-pdf": RefreshCw,
  "page-numbers": Hash,
  "watermark-pdf": Stamp,
  "pdf-editor": Layers,
  "translate-pdf": Languages,
  "ai-summarize": Languages,
  "ocr-pdf": ScanLine,
  "redact-pdf": Eraser,
  "fill-pdf": FileText,
  "compress-images": Minimize2,
  "enhance-image": Sparkles,
  "ai-scanner": ScanLine,
  "merge-images": Image,
  "word-to-pdf": FileText,
  "jpg-to-pdf": Image,
  "png-to-pdf": Image,
  "excel-to-pdf": Table,
  "pptx-to-pdf": FileArchive,
  "pdf-maker": FileUp,
  "epub-to-pdf": BookOpen,
  "universal-converter": RefreshCw,
  "pdf-to-word": FileText,
  "pdf-to-jpg": Image,
  "pdf-to-png": Image,
  "pdf-to-excel": Table,
  "pdf-to-pptx": FileArchive,
  "pdf-to-image": Image,
  "pdf-to-html": Globe,
  "pdf-to-epub": BookOpen,
  "chat-pdf": MessageSquare,
  "pdf-to-pdfa": ShieldCheck,
  "smart-scan-ai": Wand2,
  "flatten-pdf": FormInput,
  "compare-pdf": GitCompareArrows,
  "ai-question-gen": GraduationCap,
  "protect-pdf": Lock,
  "unlock-pdf": Unlock,
  "sign-pdf": PenLine,
  "hard-lock-pdf": Shield,
  "remove-watermark": Wand2,
  "generate-qr-code": QrCode,
  "document-scanner": Camera,
  "photo-resizer": ImageDown,
  "resume-builder": FileUser,
};

export function getToolIcon(slug: string): LucideIcon {
  return SLUG_ICONS[slug] ?? FileText;
}

type ToolIconProps = {
  slug: string;
  className?: string;
  /** Accessible name for SEO / screen readers (decorative when omitted). */
  label?: string;
};

/** Standardized tool icon with reserved 24×24 box (CLS-safe). */
export const ToolIcon = memo(function ToolIcon({ slug, className, label }: ToolIconProps) {
  const Icon = getToolIcon(slug);
  const title = label?.trim();
  return (
    <Icon
      className={className ?? "h-6 w-6"}
      width={24}
      height={24}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
      role={title ? "img" : undefined}
      strokeWidth={1.75}
    />
  );
});

import type { LucideIcon } from "lucide-react";
import {
  Eraser,
  FileEdit,
  GitMerge,
  ImageIcon,
  Languages,
  Minimize2,
  PenLine,
  Repeat,
  ScanLine,
  ScanText,
  Scissors,
  Wrench,
} from "lucide-react";

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  "compress-pdf": Minimize2,
  "universal-converter": Repeat,
  "pdf-editor": FileEdit,
  "tools/ai-scanner": ScanLine,
  "sign-pdf": PenLine,
  "merge-pdf": GitMerge,
  "split-pdf": Scissors,
  "ocr-pdf": ScanText,
  "remove-watermark": Eraser,
  "translate-pdf": Languages,
  "photo-resizer": ImageIcon,
  "repair-pdf": Wrench,
};

export function homeMasterIcon(slug: string): LucideIcon {
  return ICON_BY_SLUG[slug] ?? FileEdit;
}

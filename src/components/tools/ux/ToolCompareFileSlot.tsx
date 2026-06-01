"use client";

import DropZone from "@/components/DropZone";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";

type Props = {
  file: File | null;
  onFiles: (files: File[]) => void | Promise<void>;
  onClear: () => void;
  accept?: string;
  label: string;
  sublabel: string;
  className?: string;
};

/** One side of Compare PDF — dropzone or uploaded file card, never both. */
export function ToolCompareFileSlot({
  file,
  onFiles,
  onClear,
  accept = ".pdf,application/pdf",
  label,
  sublabel,
  className,
}: Props) {
  if (file) {
    return <ToolUploadedFileCard file={file} onRemove={onClear} className={className} />;
  }
  return (
    <DropZone
      accept={accept}
      multiple={false}
      onFiles={onFiles}
      label={label}
      sublabel={sublabel}
      lockSuccess
      className={className}
    />
  );
}

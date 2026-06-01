"use client";

import DropZone from "@/components/DropZone";
import { ToolMultiFileStack } from "@/components/tools/ux/ToolMultiFileStack";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";

type Props = {
  files: File[];
  onFiles: (files: File[]) => void | Promise<void>;
  multiple?: boolean;
  accept?: string;
  label?: string;
  sublabel?: string;
  onRemoveFile?: () => void;
  onRemoveAt?: (index: number) => void;
  className?: string;
};

/**
 * Upload area that fully replaces the dropzone placeholder once file(s) are selected.
 */
export function ToolUploadSlot({
  files,
  onFiles,
  multiple = false,
  accept,
  label,
  sublabel,
  onRemoveFile,
  onRemoveAt,
  className,
}: Props) {
  if (multiple) {
    return (
      <ToolMultiFileStack
        files={files}
        onAddFiles={(incoming) => void onFiles([...files, ...incoming])}
        onRemoveAt={(index) => {
          if (onRemoveAt) {
            onRemoveAt(index);
            return;
          }
          const next = files.filter((_, i) => i !== index);
          void onFiles(next);
        }}
        accept={accept}
        className={className}
      />
    );
  }

  const file = files[0];
  if (file) {
    return (
      <ToolUploadedFileCard
        file={file}
        onRemove={onRemoveFile ?? (() => void onFiles([]))}
        className={className}
      />
    );
  }

  return (
    <DropZone
      onFiles={onFiles}
      multiple={false}
      accept={accept}
      label={label}
      sublabel={sublabel}
      lockSuccess
      className={className}
    />
  );
}

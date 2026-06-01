"use client";

import { ToolFilePreviewPane } from "@/components/tools/ToolFilePreviewPane";
import type { FilePreviewSource } from "@/components/tools/filePreviewUtils";

type Props = {
  before: FilePreviewSource;
  after: FilePreviewSource;
  className?: string;
};

/** Side-by-side before / after previews after processing completes. */
export function ToolProcessPreview({ before, after, className }: Props) {
  return (
    <div className={className ?? "grid gap-4 lg:grid-cols-2"}>
      <ToolFilePreviewPane {...before} />
      <ToolFilePreviewPane {...after} />
    </div>
  );
}

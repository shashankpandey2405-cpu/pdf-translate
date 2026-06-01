"use client";

import { ToolFilePreviewPane } from "@/components/tools/ToolFilePreviewPane";
import { fileToPreviewSource } from "@/components/tools/filePreviewUtils";
import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import { useHydrated } from "@/hooks/useHydrated";
import { MobileFileMetaCard } from "@/components/mobile/MobileFileMetaCard";
import { allowsInlineMobilePreview } from "@/lib/mobile/previewPolicy";

type Props = {
  file: File | null | undefined;
  label?: string;
  compact?: boolean;
  fullPage?: boolean;
  previewLayout?: "stack" | "paged";
  className?: string;
  toolSlug?: string;
  allowMobilePreview?: boolean;
  onRemove?: () => void;
};

/** Before-processing preview in tool workspace (configure / ready step). */
export function ToolInputPreview({
  file,
  label = "Your file",
  compact = false,
  fullPage = false,
  previewLayout = "stack",
  className,
  toolSlug,
  allowMobilePreview,
  onRemove,
}: Props) {
  if (!file) return null;
  const isLg = useIsLgDesktop();
  const hydrated = useHydrated();
  if (hydrated && !isLg && !allowsInlineMobilePreview({ toolSlug, force: allowMobilePreview })) {
    return <MobileFileMetaCard file={file} className={className} onRemove={onRemove} />;
  }
  const src = fileToPreviewSource(file, label);
  const stretch = className?.includes("flex-1") || className?.includes("min-h-0");
  return (
    <div className={className ?? "mx-auto w-full min-w-0 max-w-full sm:max-w-lg"}>
      <ToolFilePreviewPane
        {...src}
        compact={compact}
        fullPage={fullPage}
        previewLayout={previewLayout}
        toolSlug={toolSlug}
        allowMobilePreview={allowMobilePreview}
        className={stretch ? "h-full min-h-0 flex-1" : undefined}
      />
    </div>
  );
}

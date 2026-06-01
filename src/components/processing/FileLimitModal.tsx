"use client";

import { useEffect } from "react";
import type { ValidationResult } from "@/lib/processing/validateProcessingRequest";
import { useToolRightSlide } from "@/context/ToolRightSlideContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: Extract<ValidationResult, { ok: false }> | null;
  toolSlug: string;
  file?: File | null;
  settings?: Record<string, unknown>;
  onContinuePremium?: () => void | Promise<void>;
};

/** Opens right slide panel — no center popup. */
export function FileLimitModal({
  open,
  onOpenChange,
  result,
  toolSlug,
  file,
  settings,
  onContinuePremium,
}: Props) {
  const { openSlide } = useToolRightSlide();

  useEffect(() => {
    if (!open || !result) return;
    onOpenChange(false);
    openSlide({ result, toolSlug, file, settings, onContinuePremium });
  }, [open, result, onOpenChange, openSlide, toolSlug, file, settings, onContinuePremium]);

  return null;
}

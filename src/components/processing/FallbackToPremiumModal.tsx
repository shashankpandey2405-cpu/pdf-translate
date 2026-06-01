"use client";

import { useEffect } from "react";
import { useToolRightSlide } from "@/context/ToolRightSlideContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
  file?: File | null;
  settings?: Record<string, unknown>;
  onTryAgain?: () => void;
  onContinuePremium?: () => void | Promise<void>;
};

/** Browser failed — steer to cloud via right slide (no popup). */
export function FallbackToPremiumModal({
  open,
  onOpenChange,
  toolSlug,
  file,
  settings,
  onContinuePremium,
}: Props) {
  const { openSlide } = useToolRightSlide();

  useEffect(() => {
    if (!open) return;
    onOpenChange(false);
    openSlide({
      result: {
        ok: false,
        code: "FILE_TOO_LARGE_NORMAL",
        message: "Use Trusted Cloud for this file.",
        suggestPremium: true,
        suggestSignIn: true,
      },
      toolSlug,
      file,
      settings,
      onContinuePremium,
    });
  }, [open, onOpenChange, openSlide, toolSlug, file, settings, onContinuePremium]);

  return null;
}

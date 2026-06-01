"use client";

import { useMemo } from "react";
import { getDeviceCapability } from "@/lib/deviceCapability";
import { usePremium } from "@/context/PremiumContext";

export function useMemoryFailsafe(opts: {
  fileSizeMB?: number;
  pageCount?: number;
}): { suggestCloud: boolean; message: string } {
  const { getBrowserLimits } = usePremium();
  const limits = getBrowserLimits();
  const { tier, deviceMemoryGb } = getDeviceCapability();

  return useMemo(() => {
    const largeFile = (opts.fileSizeMB ?? 0) > limits.maxFileMB * 0.85;
    const manyPages = (opts.pageCount ?? 0) > limits.maxPages * 0.85;
    const lowRam = deviceMemoryGb !== null && deviceMemoryGb <= 4;
    const suggestCloud = tier === "low" && (largeFile || manyPages || lowRam);

    return {
      suggestCloud,
      message:
        "Large or complex file detected. Switch to Premium Cloud Mode for advanced server processing.",
    };
  }, [opts.fileSizeMB, opts.pageCount, limits.maxFileMB, limits.maxPages, tier, deviceMemoryGb]);
}

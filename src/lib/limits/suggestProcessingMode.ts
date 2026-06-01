import { assessBrowserWorkload } from "@/lib/limits/deviceAdaptiveLimits";
import { requiresCloudOnlyProcessing, toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";
import { PLATFORM } from "@/lib/processing/documentScale";

export type ProcessingModeSuggestion = {
  recommended: "browser" | "enhanced";
  reasonKey: string;
  reasonDefault: string;
  suggestCloud: boolean;
};

/**
 * Recommends Private Local vs Turbo Cloud after upload based on file weight and device caps.
 */
export function suggestProcessingMode(input: {
  slug: string;
  file: File;
  pageCount?: number | null;
  isSignedIn?: boolean;
}): ProcessingModeSuggestion {
  const { slug, file, pageCount, isSignedIn = false } = input;
  const mb = file.size / (1024 * 1024);

  if (requiresCloudOnlyProcessing(slug)) {
    return {
      recommended: "enhanced",
      reasonKey: "execution.suggestCloudOnly",
      reasonDefault: "This tool uses Turbo Cloud for best results — sign in to continue.",
      suggestCloud: true,
    };
  }

  const workload = assessBrowserWorkload({
    slug,
    fileCount: 1,
    largestFileMB: mb,
    pageCount,
    isSignedIn,
  });

  if (!workload.allowed || workload.suggestCloud) {
    if (mb > PLATFORM.maxFileBytesBrowser / (1024 * 1024)) {
      return {
        recommended: "enhanced",
        reasonKey: "execution.suggestLargeFile",
        reasonDefault: `File is ${mb.toFixed(1)} MB — Turbo Cloud handles large PDFs without browser crashes.`,
        suggestCloud: true,
      };
    }
    if (pageCount != null && pageCount > PLATFORM.maxPagesBrowser) {
      return {
        recommended: "enhanced",
        reasonKey: "execution.suggestManyPages",
        reasonDefault: `${pageCount} pages — Turbo Cloud is more reliable than in-tab processing.`,
        suggestCloud: true,
      };
    }
    return {
      recommended: "enhanced",
      reasonKey: "execution.suggestHeavy",
      reasonDefault:
        workload.message ??
        "This file is heavy for your device — Turbo Cloud is recommended for stability.",
      suggestCloud: true,
    };
  }

  if (toolSupportsCloudProcessing(slug) && mb > 8) {
    return {
      recommended: "browser",
      reasonKey: "execution.suggestPrivateOk",
      reasonDefault: "Private Local works for this file. Choose Turbo Cloud if you want maximum quality.",
      suggestCloud: false,
    };
  }

  return {
    recommended: "browser",
    reasonKey: "execution.suggestPrivateDefault",
    reasonDefault: "Private Local — zero upload, stays on this device.",
    suggestCloud: false,
  };
}

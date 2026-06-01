import type { ProcessingMode } from "@/lib/enhanced/types";
import type { DocumentAnalysis } from "@/lib/processing/documentAnalysis";
import { scoreProcessingRoute } from "@/lib/processing/routingScore";
import {
  assessBrowserWorkload,
  getDeviceBrowserLimits,
} from "@/lib/limits/deviceAdaptiveLimits";
import { PREMIUM_MAX_FILE_MB } from "@/lib/limits/fileSizePolicy";
import { assessDocumentScale } from "@/lib/processing/documentScale";
import {
  requiresCloudOnlyProcessing,
  toolSupportsCloudProcessing,
} from "@/lib/processing/toolProfiles";
import { isClientQaModeActive } from "@/lib/qa/isQaMode";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";

export type ValidationErrorCode =
  | "FILE_TOO_LARGE_NORMAL"
  | "TOO_MANY_PAGES_NORMAL"
  | "FILE_TOO_LARGE_PREMIUM"
  | "TOO_MANY_PAGES_PREMIUM"
  | "DAILY_LIMIT"
  | "CLOUD_UNAVAILABLE";

export type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: ValidationErrorCode;
      message: string;
      suggestPremium?: boolean;
      suggestSignIn?: boolean;
    };

type Args = {
  slug: string;
  mode: ProcessingMode;
  file: File;
  pageCount?: number | null;
  enhancedRemaining?: number;
  isSignedIn?: boolean;
  isPremium?: boolean;
  analysis?: DocumentAnalysis | null;
};

function mapScaleError(
  code: string | undefined,
  message: string | undefined,
  isPremium: boolean,
): ValidationResult {
  const suggestPremium = code === "file_too_large" && !isPremium;
  return {
    ok: false,
    code:
      code === "too_many_pages"
        ? isPremium
          ? "TOO_MANY_PAGES_PREMIUM"
          : "TOO_MANY_PAGES_PREMIUM"
        : isPremium
          ? "FILE_TOO_LARGE_PREMIUM"
          : "FILE_TOO_LARGE_PREMIUM",
    message:
      message ??
      (suggestPremium
        ? "This file needs Premium advanced processing for large documents."
        : "This file exceeds the platform limit. Try splitting the PDF first."),
    suggestPremium,
  };
}

export function validateProcessingRequest(args: Args): ValidationResult {
  const { slug, mode, file, pageCount, enhancedRemaining, isSignedIn, isPremium } = args;

  if (mode === "browser" && requiresCloudOnlyProcessing(slug)) {
    return {
      ok: false,
      code: "CLOUD_UNAVAILABLE",
      message: SIGN_IN_REASON.cloudTurbo,
      suggestSignIn: true,
    };
  }

  if (mode === "enhanced") {
    if (!toolSupportsCloudProcessing(slug)) {
      return {
        ok: false,
        code: "CLOUD_UNAVAILABLE",
        message:
          "Advanced processing for this format is launching soon. Use Private Local mode or try another tool.",
      };
    }
    if (!isSignedIn) {
      return {
        ok: false,
        code: "CLOUD_UNAVAILABLE",
        message: SIGN_IN_REASON.cloudTurbo,
        suggestSignIn: true,
      };
    }
    if (!isClientQaModeActive() && enhancedRemaining !== undefined && enhancedRemaining <= 0) {
      return {
        ok: false,
        code: "DAILY_LIMIT",
        message:
          "Monthly credits used up. Upgrade to Premium for 500 credits/month, or wait until next month.",
      };
    }

    const scale = assessDocumentScale({
      toolSlug: slug,
      fileSizeBytes: file.size,
      pageCount: pageCount ?? null,
      path: "advanced",
      isPremium: Boolean(isPremium),
    });
    if (!scale.ok) {
      const mapped = mapScaleError(scale.code, scale.message, Boolean(isPremium));
      if (!isPremium && (scale.code === "file_too_large" || scale.code === "too_many_pages")) {
        return mapped.ok ? mapped : { ...mapped, suggestPremium: true };
      }
      return mapped;
    }
    return { ok: true };
  }

  const device = getDeviceBrowserLimits();
  const browserLimits = isPremium
    ? {
        maxFileBytes: PREMIUM_MAX_FILE_MB * 1024 * 1024,
        maxPages: 500,
      }
    : {
        maxFileBytes: device.maxFileMB * 1024 * 1024,
        maxPages: device.maxPages,
      };

  const workload = assessBrowserWorkload({
    slug,
    fileCount: 1,
    largestFileMB: file.size / (1024 * 1024),
    pageCount,
    isSignedIn: Boolean(isSignedIn),
  });

  const scale = assessDocumentScale({
    toolSlug: slug,
    fileSizeBytes: file.size,
    pageCount: pageCount ?? null,
    path: "browser",
    browserLimits,
  });

  const routeScore = scoreProcessingRoute({
    slug,
    file,
    pageCount: pageCount ?? null,
    isSignedIn: Boolean(isSignedIn),
    analysis: args.analysis ?? null,
  });
  if (routeScore.blockBrowser) {
    return {
      ok: false,
      code: "CLOUD_UNAVAILABLE",
      message: routeScore.reasonDefault,
      suggestSignIn: !isSignedIn,
      suggestPremium: true,
    };
  }

  if (!scale.ok) {
    return {
      ok: false,
      code: workload.tooHeavyForDevice ? "FILE_TOO_LARGE_NORMAL" : "TOO_MANY_PAGES_NORMAL",
      message: scale.message ?? workload.message ?? "This file is too heavy for browser processing on this device.",
      suggestPremium: true,
      suggestSignIn: !isSignedIn,
    };
  }

  if (!workload.allowed) {
    return {
      ok: false,
      code: workload.tooHeavyForDevice ? "FILE_TOO_LARGE_NORMAL" : "TOO_MANY_PAGES_NORMAL",
      message: workload.message ?? "This file is too heavy for browser processing on this device.",
      suggestPremium: workload.suggestCloud,
      suggestSignIn: workload.suggestSignIn,
    };
  }

  return { ok: true };
}

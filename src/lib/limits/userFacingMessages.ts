import type { ValidationErrorCode } from "@/lib/processing/validateProcessingRequest";

/** User-facing copy without quotas, MB limits, or job counts. */
export function validationTitle(code: ValidationErrorCode): string {
  switch (code) {
    case "DAILY_LIMIT":
      return "Upgrade to keep going";
    case "CLOUD_UNAVAILABLE":
      return "Cloud processing";
    case "FILE_TOO_LARGE_PREMIUM":
    case "TOO_MANY_PAGES_PREMIUM":
      return "Premium required";
    case "TOO_MANY_PAGES_NORMAL":
      return "Use Trusted Cloud";
    default:
      return "Use Trusted Cloud";
  }
}

export function validationBody(code: ValidationErrorCode, toolRequiresCloud?: boolean): string {
  switch (code) {
    case "DAILY_LIMIT":
      return "Choose a Premium plan to continue with cloud and AI tools. Free browser tools remain available on other pages.";
    case "CLOUD_UNAVAILABLE":
      return toolRequiresCloud
        ? "This tool needs secure cloud processing. Sign in to continue, or upgrade for full access."
        : "Sign in to run this job in the cloud, or use a browser-based tool on the free plan.";
    case "FILE_TOO_LARGE_PREMIUM":
    case "TOO_MANY_PAGES_PREMIUM":
      return "This file needs Premium cloud processing. Pick a plan below or try a browser-based tool.";
    case "TOO_MANY_PAGES_NORMAL":
      return "This document is easier to process in the cloud with higher accuracy.";
    default:
      return "For best results, use Trusted Cloud processing. Sign in free or upgrade for Premium features.";
  }
}

import { getToolProfile, toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";
import type { ProcessingMode } from "@/lib/enhanced/types";

export function getProcessingTrustLine(slug: string, mode: ProcessingMode): string {
  const profile = getToolProfile(slug);
  if (mode === "enhanced" && toolSupportsCloudProcessing(slug)) {
    return "Processed securely in encrypted cloud servers. Files are deleted within 24 hours.";
  }
  if (profile.tier === "hybrid") {
    return "Choose Browser or Secure Cloud Processing — this result used your selected mode.";
  }
  return "Processed locally in your browser. Your file was not sent to our servers.";
}

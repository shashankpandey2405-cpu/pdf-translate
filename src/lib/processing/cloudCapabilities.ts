import { toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";

/** True only when Turbo Cloud can actually run this tool (worker pool exists). */
export function canRunCloudForTool(slug: string): boolean {
  return toolSupportsCloudProcessing(slug);
}

/** Safe cloud routing — never steer users to a non-existent worker path. */
export function canSuggestCloudForTool(slug: string): boolean {
  return canRunCloudForTool(slug);
}

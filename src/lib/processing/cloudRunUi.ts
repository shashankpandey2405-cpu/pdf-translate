import type { ProcessingMode } from "@/lib/enhanced/types";
import type { EnhancedJobUiStatus } from "@/hooks/useEnhancedJob";

/** True when UI should treat the run as Trusted Cloud (progress, labels, polling). */
export function isCloudRunUiActive(
  enhancedUiEnabled: boolean,
  mode: ProcessingMode,
  opts: {
    usedCloudConvert?: boolean;
    cloudStatus?: EnhancedJobUiStatus;
  },
): boolean {
  if (!enhancedUiEnabled) return false;
  if (mode === "enhanced" || opts.usedCloudConvert) return true;
  const st = opts.cloudStatus;
  return st === "queued" || st === "processing" || st === "downloading";
}

import {
  getToolProcessingBadge,
  requiresCloudOnlyProcessing,
  toolSupportsCloudProcessing,
  type ToolProcessingBadge,
} from "@/lib/processing/toolProfiles";

export type ProcessingPathKind = "browser" | "cloud" | "hybrid";

export function processingPathKindForSlug(slug: string): ProcessingPathKind {
  if (requiresCloudOnlyProcessing(slug)) return "cloud";
  const badge = getToolProcessingBadge(slug);
  if (badge === "browser") return "browser";
  if (badge === "hybrid" || badge === "cloud_premium") return "hybrid";
  return "browser";
}

export type ProcessingPathCopy = {
  badge: string;
  hint: string;
  resultLine: string;
};

const BROWSER_COPY: ProcessingPathCopy = {
  badge: "Private Local",
  hint: "Your file stays on this device — zero cloud upload for this step.",
  resultLine: "Processed locally in Private Local mode — your file was not uploaded to our servers.",
};

const CLOUD_COPY: ProcessingPathCopy = {
  badge: "Turbo Cloud",
  hint: "Heavy or advanced jobs run on encrypted cloud workers; temporary files auto-delete.",
  resultLine: "Processed on Turbo Cloud — encrypted staging with automatic file purge after delivery.",
};

const HYBRID_COPY: ProcessingPathCopy = {
  badge: "Hybrid · Local or Turbo",
  hint: "Private Local for privacy on supported tools; Turbo Cloud for large files, low-memory devices, and AI.",
  resultLine: "Choose Private Local (zero upload) or Turbo Cloud (large files + auto-delete) before processing.",
};

export function processingPathCopy(
  slug: string,
  executedVia?: "browser" | "cloud",
): ProcessingPathCopy {
  if (executedVia === "browser") return BROWSER_COPY;
  if (executedVia === "cloud") return CLOUD_COPY;

  const kind = processingPathKindForSlug(slug);
  if (kind === "cloud") return CLOUD_COPY;
  if (kind === "hybrid") return HYBRID_COPY;
  return BROWSER_COPY;
}

export function shouldShowProcessingPathBadge(slug: string): boolean {
  const badge = getToolProcessingBadge(slug);
  return (
    badge === "browser" ||
    badge === "hybrid" ||
    badge === "cloud_premium" ||
    toolSupportsCloudProcessing(slug) ||
    requiresCloudOnlyProcessing(slug)
  );
}

export function badgeVariantForSlug(slug: string): ToolProcessingBadge {
  return getToolProcessingBadge(slug);
}

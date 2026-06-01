import {
  CLOUD_MAX_FILE_MB,
  CLOUD_OCR_MAX_PAGES,
  FREE_MONTHLY_CREDITS,
  getDeviceBrowserLimits,
} from "@/lib/limits/deviceAdaptiveLimits";
import {
  getCloudExecutionState,
  getToolProfile,
  requiresCloudOnlyProcessing,
  toolSupportsCloudProcessing,
} from "@/lib/processing/toolProfiles";
import { TRUST_SHIELD_BULK_MAX_FILES } from "@/lib/trustShield/constants";

export type ToolLimitsRow = {
  id: string;
  label: string;
  browser: string;
  premium: string;
};

export type ToolLimitsDisplay = {
  slug: string;
  deviceTier: string;
  showPremiumColumn: boolean;
  premiumColumnTitle: string;
  browserColumnTitle: string;
  footnote?: string;
  rows: ToolLimitsRow[];
};

function tierLabel(tier: string): string {
  if (tier === "low") return "phone / low RAM";
  if (tier === "high") return "desktop / high RAM";
  return "standard device";
}

function mergeMaxFiles(slug: string, deviceMax: number): number {
  if (slug === "merge-pdf") return deviceMax;
  return deviceMax;
}

/** Rows for the browser vs Trusted Cloud limits table on tool pages. */
export function getToolLimitsDisplay(slug: string): ToolLimitsDisplay {
  const device = getDeviceBrowserLimits();
  const profile = getToolProfile(slug);
  const cloudState = getCloudExecutionState(slug);
  const cloudOnly = requiresCloudOnlyProcessing(slug);
  const cloudActive = toolSupportsCloudProcessing(slug) && cloudState === "active";

  const browserFile = `${device.maxFileMB} MB`;
  const browserPages = `${device.maxPages} pages`;
  const premiumFile = `${profile.premiumMaxFileMB ?? CLOUD_MAX_FILE_MB} MB`;
  const premiumPages =
    profile.premiumMaxPages != null ? `${profile.premiumMaxPages} pages` : "—";

  const rows: ToolLimitsRow[] = [];

  if (slug === "merge-pdf") {
    rows.push({
      id: "files",
      label: "Files per batch",
      browser: `Up to ${mergeMaxFiles(slug, device.maxMergeFiles)} (Privacy mode: ${TRUST_SHIELD_BULK_MAX_FILES})`,
      premium: cloudActive ? `Same in browser; cloud not required` : "—",
    });
  }

  rows.push({
    id: "fileSize",
    label: "Max file size",
    browser: cloudOnly ? "Not available (cloud only)" : browserFile,
    premium: cloudActive
      ? premiumFile
      : cloudState === "cloudOnly"
        ? premiumFile
        : "Coming soon",
  });

  const showPageRow =
    cloudOnly ||
    profile.normalMaxPages != null ||
    profile.premiumMaxPages != null ||
    [
      "pdf-to-word",
      "pdf-to-excel",
      "pdf-to-image",
      "pdf-to-jpg",
      "pdf-to-png",
      "pdf-to-html",
      "pdf-to-epub",
      "ocr-pdf",
      "compress-pdf",
      "redact-pdf",
      "protect-pdf",
      "unlock-pdf",
      "hard-lock-pdf",
      "pdf-editor",
      "rotate-pdf",
      "split-pdf",
      "repair-pdf",
    ].includes(slug);

  if (showPageRow) {
    const browserPageVal = cloudOnly
      ? "Use Trusted Cloud"
      : profile.normalMaxPages != null
        ? `${Math.min(device.maxPages, profile.normalMaxPages)} pages (device cap ${device.maxPages})`
        : browserPages;

    let premiumPageVal = "—";
    if (cloudOnly && slug === "ocr-pdf") {
      premiumPageVal = `${CLOUD_OCR_MAX_PAGES} pages (OCR)`;
    } else if (cloudActive && profile.premiumMaxPages != null) {
      premiumPageVal = premiumPages;
    } else if (cloudOnly) {
      premiumPageVal = premiumPages !== "—" ? premiumPages : browserPages;
    }

    rows.push({
      id: "pages",
      label: "Max pages",
      browser: browserPageVal,
      premium: premiumPageVal,
    });
  }

  rows.push({
    id: "cloudJobs",
    label: "Trusted Cloud runs",
    browser: cloudOnly ? "—" : "Unlimited browser runs",
    premium: cloudActive || cloudOnly
      ? `${FREE_MONTHLY_CREDITS} credits / month (free sign-in) · 1 credit per cloud run`
      : "Available on hybrid tools (compress, OCR, Word, …)",
  });

  let footnote: string | undefined;
  if (cloudOnly) {
    footnote =
      "This tool runs on secure cloud servers. Sign in free — no paid subscription required for Trusted Cloud quota.";
  } else if (cloudActive) {
    footnote =
      "Browser limits adapt to your device so the tab stays stable. Trusted Cloud (Premium) uses up to 60MB files and stronger engines — sign in free.";
  } else {
    footnote =
      "Processing stays in your browser on this device. Limits above prevent tab crashes on large files.";
  }

  if (slug === "compress-pdf") {
    footnote +=
      " Browser compress is light optimization; use Trusted Cloud for Ghostscript-level size reduction.";
  }
  if (slug === "pdf-to-word") {
    footnote += " Browser exports RTF text; Cloud gives layout-aware DOCX.";
  }

  const browserOnlyTool = !cloudOnly && !cloudActive && cloudState !== "comingSoon";

  if (browserOnlyTool && rows.length) {
    const fileRow = rows.find((r) => r.id === "fileSize");
    if (fileRow) fileRow.premium = "Not needed — runs fully in browser";
    const pageRow = rows.find((r) => r.id === "pages");
    if (pageRow) pageRow.premium = "—";
  }

  return {
    slug,
    deviceTier: tierLabel(device.tier),
    showPremiumColumn: true,
    browserColumnTitle: "Browser (free, unlimited runs)",
    premiumColumnTitle: cloudOnly
      ? "Trusted Cloud (required)"
      : cloudActive
        ? "Trusted Cloud / Premium (free account)"
        : "Trusted Cloud (optional)",
    footnote,
    rows,
  };
}

/** Single source of truth for 2-tier hybrid processing per tool. */

export type ProcessingTier = "hybrid" | "cloud_only" | "browser_only" | "browser_first";
export type WorkerPool =
  | "compress"
  | "docx"
  | "ocr"
  | "excel"
  | "office"
  | "security"
  | "convert"
  | "ai";

export type ToolProcessingProfile = {
  slug: string;
  tier: ProcessingTier;
  normalMaxFileMB: number;
  normalMaxPages?: number;
  premiumMaxFileMB: number;
  premiumMaxPages?: number;
  supportsCloud: boolean;
  workerPool?: WorkerPool;
};

export const NORMAL_MAX_FILE_MB = 15;
export const NORMAL_MAX_PAGES_WORD_OCR = 10;
/** Signed-in free advanced processing (not paid subscription). */
export const PREMIUM_MAX_FILE_MB = 60;
/** Paid Premium platform ceiling. */
export const PLATFORM_PREMIUM_MAX_FILE_MB = 500;
export const PLATFORM_PREMIUM_MAX_PAGES = 100;

const HYBRID_SLUGS: Array<{
  slug: string;
  normalMaxPages?: number;
  premiumMaxPages?: number;
  workerPool?: WorkerPool;
  supportsCloud?: boolean;
}> = [
  { slug: "compress-pdf", premiumMaxPages: 100, workerPool: "compress", supportsCloud: true },
  { slug: "pdf-to-word", normalMaxPages: 10, premiumMaxPages: 100, workerPool: "docx", supportsCloud: true },
  { slug: "pdf-to-excel", normalMaxPages: 10, premiumMaxPages: 100, workerPool: "excel", supportsCloud: true },
  {
    slug: "pdf-to-image",
    premiumMaxPages: 100,
    workerPool: "convert",
    supportsCloud: true,
  },
  {
    slug: "pdf-to-jpg",
    premiumMaxPages: 100,
    workerPool: "convert",
    supportsCloud: true,
  },
  {
    slug: "pdf-to-png",
    premiumMaxPages: 100,
    workerPool: "convert",
    supportsCloud: true,
  },
  { slug: "photo-resizer" },
  { slug: "png-to-pdf" },
  { slug: "jpg-to-pdf" },
  { slug: "protect-pdf", premiumMaxPages: 100, workerPool: "security", supportsCloud: true },
  { slug: "unlock-pdf", premiumMaxPages: 100, workerPool: "security", supportsCloud: true },
  { slug: "redact-pdf", premiumMaxPages: 100, workerPool: "security", supportsCloud: true },
  { slug: "pdf-to-pdfa", premiumMaxPages: 100, workerPool: "convert", supportsCloud: false },
];

const CLOUD_ONLY_SLUGS: Array<{
  slug: string;
  supportsCloud: boolean;
  workerPool?: WorkerPool;
  premiumMaxPages?: number;
}> = [
  { slug: "ocr-pdf", supportsCloud: true, workerPool: "ocr", premiumMaxPages: 100 },
  { slug: "pptx-to-pdf", supportsCloud: true, workerPool: "office", premiumMaxPages: 100 },
  { slug: "word-to-pdf", supportsCloud: true, workerPool: "office", premiumMaxPages: 100 },
  { slug: "pdf-to-pptx", supportsCloud: true, workerPool: "convert", premiumMaxPages: 100 },
];

const AI_HYBRID_SLUGS: Array<{
  slug: string;
  premiumMaxPages?: number;
  workerPool?: WorkerPool;
  supportsCloud?: boolean;
}> = [
  { slug: "ai-summarize", premiumMaxPages: 2, workerPool: "ai", supportsCloud: true },
  { slug: "translate-pdf", premiumMaxPages: 2, workerPool: "ai", supportsCloud: true },
  { slug: "chat-pdf", premiumMaxPages: 10, workerPool: "ai", supportsCloud: true },
  { slug: "smart-scan-ai", premiumMaxPages: 5, workerPool: "ai", supportsCloud: true },
  { slug: "ai-question-gen", premiumMaxPages: 5, workerPool: "ai", supportsCloud: true },
];

function buildHybridProfile(entry: (typeof HYBRID_SLUGS)[number]): ToolProcessingProfile {
  return {
    slug: entry.slug,
    tier: "hybrid",
    normalMaxFileMB: NORMAL_MAX_FILE_MB,
    normalMaxPages: entry.normalMaxPages,
    premiumMaxFileMB: PREMIUM_MAX_FILE_MB,
    premiumMaxPages: entry.premiumMaxPages,
    supportsCloud: entry.supportsCloud ?? false,
    workerPool: entry.workerPool,
  };
}

function buildCloudOnlyProfile(entry: (typeof CLOUD_ONLY_SLUGS)[number]): ToolProcessingProfile {
  return {
    slug: entry.slug,
    tier: "cloud_only",
    normalMaxFileMB: NORMAL_MAX_FILE_MB,
    premiumMaxFileMB: PREMIUM_MAX_FILE_MB,
    premiumMaxPages: entry.premiumMaxPages,
    supportsCloud: entry.supportsCloud,
    workerPool: entry.workerPool,
  };
}

const PROFILE_MAP: Record<string, ToolProcessingProfile> = {};

for (const entry of HYBRID_SLUGS) {
  PROFILE_MAP[entry.slug] = buildHybridProfile(entry);
}
for (const entry of CLOUD_ONLY_SLUGS) {
  PROFILE_MAP[entry.slug] = buildCloudOnlyProfile(entry);
}
for (const entry of AI_HYBRID_SLUGS) {
  PROFILE_MAP[entry.slug] = buildHybridProfile(entry);
}

const DEFAULT_BROWSER_ONLY: Omit<ToolProcessingProfile, "slug"> = {
  tier: "browser_only",
  normalMaxFileMB: NORMAL_MAX_FILE_MB,
  premiumMaxFileMB: PREMIUM_MAX_FILE_MB,
  supportsCloud: false,
};

export function getToolProfile(slug: string): ToolProcessingProfile {
  const existing = PROFILE_MAP[slug];
  if (existing) return existing;
  return { slug, ...DEFAULT_BROWSER_ONLY };
}

export function isHybridTool(slug: string): boolean {
  return getToolProfile(slug).tier === "hybrid";
}

export function isCloudOnlyTool(slug: string): boolean {
  return getToolProfile(slug).tier === "cloud_only";
}

export function toolSupportsCloudProcessing(slug: string): boolean {
  const p = getToolProfile(slug);
  return p.supportsCloud && Boolean(p.workerPool);
}

/** OCR and similar tools that must never run in the browser. */
export function requiresCloudOnlyProcessing(slug: string): boolean {
  const p = getToolProfile(slug);
  return p.tier === "cloud_only" && p.supportsCloud && Boolean(p.workerPool);
}

export function getCloudOnlyToolSlugs(): string[] {
  return CLOUD_ONLY_SLUGS.filter((e) => e.supportsCloud && e.workerPool).map((e) => e.slug);
}

export function isCloudOnlyToolPath(pathname: string): boolean {
  return getCloudOnlyToolSlugs().some((slug) => pathname.includes(`/${slug}`));
}

export function getNormalPageCap(slug: string): number | null {
  const p = getToolProfile(slug);
  return p.normalMaxPages ?? null;
}

export function getPremiumPageCap(slug: string): number | null {
  const p = getToolProfile(slug);
  return p.premiumMaxPages ?? null;
}

export type ToolProcessingBadge = "browser" | "hybrid" | "cloud_premium" | "cloud_soon";

export type CloudExecutionState = "active" | "comingSoon" | "cloudOnly";

/** UI state for the Cloud Processing card (always shown except pure browser marketing). */
export function getCloudExecutionState(slug: string): CloudExecutionState {
  if (requiresCloudOnlyProcessing(slug)) return "cloudOnly";
  if (toolSupportsCloudProcessing(slug)) return "active";
  return "comingSoon";
}

export function getToolProcessingBadge(slug: string): ToolProcessingBadge {
  const p = getToolProfile(slug);
  if (p.tier === "cloud_only") return p.supportsCloud ? "cloud_premium" : "cloud_soon";
  if (p.tier === "hybrid" && p.supportsCloud) return "cloud_premium";
  if (p.tier === "hybrid") return "hybrid";
  return "browser";
}

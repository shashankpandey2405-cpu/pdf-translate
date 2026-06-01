import { envString } from "@/server/env";
import {
  maxAiFileBytesForUser,
  maxPagesAffordableWithCredits,
} from "@/server/credits/aiWorkloadLimits";
import { isRedisConfigured } from "@/server/redis/client";
import { hasS3Credentials } from "@/server/s3";
import { getAppEnv } from "@/server/types";

export const ENHANCED_DAILY_LIMIT = Number(envString("ENHANCED_DAILY_LIMIT", "2")) || 2;
export const ENHANCED_TRIAL_MAX_FILE_MB = Number(envString("ENHANCED_TRIAL_MAX_FILE_MB", "15")) || 15;
export const ENHANCED_TRIAL_MAX_PAGES = Number(envString("ENHANCED_TRIAL_MAX_PAGES", "10")) || 10;
export const ENHANCED_MAX_FILE_MB = Number(envString("ENHANCED_MAX_FILE_MB", "60")) || 60;
export const ENHANCED_PREMIUM_MAX_FILE_MB =
  Number(envString("ENHANCED_PREMIUM_MAX_FILE_MB", "500")) || 500;
export const ENHANCED_STANDARD_MAX_PAGES =
  Number(envString("ENHANCED_STANDARD_MAX_PAGES", "50")) || 50;
export const ENHANCED_PREMIUM_MAX_PAGES =
  Number(envString("ENHANCED_PREMIUM_MAX_PAGES", "100")) || 100;
/** @deprecated Use ENHANCED_STANDARD_MAX_PAGES for free tier fallbacks. */
export const ENHANCED_MAX_PAGES = ENHANCED_STANDARD_MAX_PAGES;
export const ENHANCED_MAX_FILE_BYTES = ENHANCED_MAX_FILE_MB * 1024 * 1024;
export const ENHANCED_TRIAL_MAX_FILE_BYTES = ENHANCED_TRIAL_MAX_FILE_MB * 1024 * 1024;
export const ENHANCED_PREMIUM_MAX_FILE_BYTES = ENHANCED_PREMIUM_MAX_FILE_MB * 1024 * 1024;

/** Per-tool page caps for signed-in free advanced tier. */
export const ENHANCED_PAGE_LIMITS: Record<string, number> = {
  "ocr-pdf": Number(envString("ENHANCED_OCR_MAX_PAGES", "20")) || 20,
  "compress-pdf": Number(envString("ENHANCED_COMPRESS_MAX_PAGES", "50")) || 50,
  "pdf-to-word": Number(envString("ENHANCED_DOCX_MAX_PAGES", "50")) || 50,
  "pdf-to-excel": Number(envString("ENHANCED_EXCEL_MAX_PAGES", "50")) || 50,
  "protect-pdf": Number(envString("ENHANCED_SECURITY_MAX_PAGES", "50")) || 50,
  "unlock-pdf": Number(envString("ENHANCED_SECURITY_MAX_PAGES", "50")) || 50,
  "redact-pdf": Number(envString("ENHANCED_SECURITY_MAX_PAGES", "50")) || 50,
  "word-to-pdf": Number(envString("ENHANCED_OFFICE_MAX_PAGES", "50")) || 50,
  "pptx-to-pdf": Number(envString("ENHANCED_OFFICE_MAX_PAGES", "50")) || 50,
  "pdf-to-image": Number(envString("ENHANCED_CONVERT_MAX_PAGES", "50")) || 50,
  "pdf-to-png": Number(envString("ENHANCED_CONVERT_MAX_PAGES", "50")) || 50,
  "pdf-to-jpg": Number(envString("ENHANCED_CONVERT_MAX_PAGES", "50")) || 50,
  "pdf-to-pptx": Number(envString("ENHANCED_CONVERT_MAX_PAGES", "50")) || 50,
};

/** Per-tool page caps for paid Premium subscribers (batched on workers when needed). */
export const ENHANCED_PREMIUM_PAGE_LIMITS: Record<string, number> = {
  "ocr-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "compress-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "pdf-to-word": ENHANCED_PREMIUM_MAX_PAGES,
  "pdf-to-excel": ENHANCED_PREMIUM_MAX_PAGES,
  "protect-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "unlock-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "redact-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "word-to-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "pptx-to-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "pdf-to-image": ENHANCED_PREMIUM_MAX_PAGES,
  "pdf-to-png": ENHANCED_PREMIUM_MAX_PAGES,
  "pdf-to-jpg": ENHANCED_PREMIUM_MAX_PAGES,
  "pdf-to-pptx": ENHANCED_PREMIUM_MAX_PAGES,
  "ai-summarize": ENHANCED_PREMIUM_MAX_PAGES,
  "translate-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "chat-pdf": Number(envString("ENHANCED_AI_CHAT_MAX_PAGES", "10")) || 10,
  "smart-scan-ai": 5,
  "ai-question-gen": 5,
  "ai-rewrite-pdf": ENHANCED_PREMIUM_MAX_PAGES,
  "ai-resume-builder": ENHANCED_PREMIUM_MAX_PAGES,
};

export type EnhancedLimitOptions = {
  isPremium?: boolean;
  /** Signed-in user available credits — scales page cap when set. */
  creditAvailable?: number;
  useTrial?: boolean;
};

export function enhancedPageLimitForTool(
  slug: string,
  processingMode?: string,
  opts?: EnhancedLimitOptions,
): number {
  if (processingMode === "ai_plus" || processingMode === "classic_mt") {
    if (opts?.useTrial) {
      return ENHANCED_AI_PAGE_LIMITS[slug] ?? 2;
    }
    if (opts?.isPremium) {
      return ENHANCED_PREMIUM_PAGE_LIMITS[slug] ?? ENHANCED_PREMIUM_MAX_PAGES;
    }
    if (typeof opts?.creditAvailable === "number" && opts.creditAvailable > 0) {
      return maxPagesAffordableWithCredits(slug, opts.creditAvailable, false);
    }
    return ENHANCED_AI_PAGE_LIMITS[slug] ?? 2;
  }
  if (opts?.isPremium) {
    return ENHANCED_PREMIUM_PAGE_LIMITS[slug] ?? ENHANCED_PREMIUM_MAX_PAGES;
  }
  return Math.min(
    ENHANCED_PAGE_LIMITS[slug] ?? ENHANCED_TRIAL_MAX_PAGES,
    ENHANCED_TRIAL_MAX_PAGES,
  );
}

export function enhancedMaxFileBytesForTool(
  slug: string,
  processingMode?: string,
  opts?: EnhancedLimitOptions,
): number {
  if (processingMode === "ai_plus" || processingMode === "classic_mt") {
    return maxAiFileBytesForUser(
      Boolean(opts?.isPremium),
      opts?.creditAvailable ?? 0,
      Boolean(opts?.useTrial),
    );
  }
  if (opts?.isPremium) {
    return ENHANCED_PREMIUM_MAX_FILE_BYTES;
  }
  return ENHANCED_TRIAL_MAX_FILE_BYTES;
}

export const QUEUE_MAX_DEPTH = Number(envString("ENHANCED_QUEUE_MAX_DEPTH", "50")) || 50;

export const WORKER_POOLS = [
  "ocr",
  "docx",
  "compress",
  "excel",
  "office",
  "security",
  "convert",
  "ai",
  "translate",
] as const;
export type WorkerPool = (typeof WORKER_POOLS)[number];

const TOOL_POOL_MAP: Record<string, WorkerPool> = {
  "pdf-to-word": "docx",
  "pdf-to-excel": "excel",
  "compress-pdf": "compress",
  "ocr-pdf": "ocr",
  "word-to-pdf": "office",
  "pptx-to-pdf": "office",
  "protect-pdf": "security",
  "unlock-pdf": "security",
  "redact-pdf": "security",
  "pdf-to-image": "convert",
  "pdf-to-png": "convert",
  "pdf-to-jpg": "convert",
  "pdf-to-pptx": "convert",
  /** pdf-to-pdfa: browser-only until convert worker implements PDF/A export */
  "ai-summarize": "ai",
  "translate-pdf": "ai",
  "chat-pdf": "ai",
  "smart-scan-ai": "ai",
  "ai-question-gen": "ai",
};

export const ENHANCED_AI_PAGE_LIMITS: Record<string, number> = {
  "ai-summarize": Number(envString("ENHANCED_AI_TRIAL_MAX_PAGES", "2")) || 2,
  "translate-pdf": Number(envString("ENHANCED_AI_TRIAL_MAX_PAGES", "2")) || 2,
  "chat-pdf": Number(envString("ENHANCED_AI_CHAT_MAX_PAGES", "10")) || 10,
  "smart-scan-ai": 5,
  "ai-question-gen": 5,
};

export function workerPoolForTool(slug: string, processingMode?: string): WorkerPool | null {
  if (slug === "translate-pdf" && processingMode === "classic_mt") return "translate";
  return TOOL_POOL_MAP[slug] ?? null;
}

export function queueKeyForPool(pool: WorkerPool): string {
  return `enhanced:queue:${pool}`;
}

export function isEnhancedInfraConfigured(): boolean {
  const env = getAppEnv();
  return Boolean(
    isRedisConfigured() &&
      envString("SUPABASE_SERVICE_ROLE_KEY") &&
      hasS3Credentials(env),
  );
}

export const VALID_JOB_STATUSES = ["queued", "processing", "done", "failed", "cancelled"] as const;
export type JobStatus = (typeof VALID_JOB_STATUSES)[number];

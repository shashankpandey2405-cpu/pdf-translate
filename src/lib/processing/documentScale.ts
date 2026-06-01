/**
 * Platform-wide document scale — single source for 1 page → 100 pages, ~1 MB → 500 MB.
 * Technical caps live here; marketing/pricing copy stays in Terms of Service.
 */

import { getToolProfile } from "@/lib/processing/toolProfiles";

export const PLATFORM = {
  /** Absolute platform maximum (Premium advanced processing). */
  maxFileBytesPremium: 500 * 1024 * 1024,
  maxFileBytesStandard: 15 * 1024 * 1024,
  maxPagesPremium: 100,
  maxPagesStandard: 10,
  minPages: 1,
  /** Browser in-tab processing ceiling (before steer to advanced). */
  maxFileBytesBrowser: 20 * 1024 * 1024,
  maxPagesBrowser: 80,
  /** R2 staging thresholds (aligned with server/uploadPolicy.ts). */
  stagingMinBytes: 20 * 1024 * 1024,
  presignedPutMaxBytes: 35 * 1024 * 1024,
  /** Worker batch sizes — avoids OOM on Railway/Vercel. */
  ocrPagesPerBatch: 15,
  compressPagesPerBatch: 25,
  convertPagesPerBatch: 20,
  aiPagesPerBatch: 2,
} as const;

export type ProcessingPath = "browser" | "advanced";
export type UploadStrategy = "local" | "presigned_put" | "multipart";
export type DocumentSizeTier = "micro" | "small" | "medium" | "large" | "xlarge";

export type BrowserScaleLimits = {
  maxFileBytes: number;
  maxPages: number;
};

export type DocumentScaleInput = {
  toolSlug: string;
  fileSizeBytes: number;
  pageCount: number | null;
  path: ProcessingPath;
  isPremium?: boolean;
  /** Device-adaptive caps for in-browser processing. */
  browserLimits?: BrowserScaleLimits;
};

export type PageBatch = { startPage: number; endPage: number; count: number };

export type DocumentScaleAssessment = {
  ok: boolean;
  tier: DocumentSizeTier;
  path: ProcessingPath;
  uploadStrategy: UploadStrategy;
  pageBatches: PageBatch[];
  batched: boolean;
  maxFileBytes: number;
  maxPages: number;
  code?: string;
  message?: string;
};

function sizeTier(bytes: number, pages: number | null): DocumentSizeTier {
  const mb = bytes / (1024 * 1024);
  const p = pages ?? 1;
  if (mb <= 3 && p <= 5) return "micro";
  if (mb <= 15 && p <= 20) return "small";
  if (mb <= 60 && p <= 50) return "medium";
  if (mb <= 150 && p <= 75) return "large";
  return "xlarge";
}

export function maxFileBytesForPath(path: ProcessingPath, isPremium: boolean): number {
  if (path === "browser") return PLATFORM.maxFileBytesBrowser;
  return isPremium ? PLATFORM.maxFileBytesPremium : PLATFORM.maxFileBytesStandard;
}

export function maxPagesForTool(
  path: ProcessingPath,
  toolSlug: string,
  isPremium: boolean,
  browserLimits?: BrowserScaleLimits,
): number {
  if (path === "browser") {
    return browserLimits?.maxPages ?? PLATFORM.maxPagesBrowser;
  }
  const profile = getToolProfile(toolSlug);
  const platformCap = isPremium ? PLATFORM.maxPagesPremium : PLATFORM.maxPagesStandard;
  const toolCap = profile.premiumMaxPages ?? platformCap;
  return Math.min(toolCap, platformCap);
}

export function uploadStrategyForFile(fileSizeBytes: number, maxUploadBytes: number): UploadStrategy {
  if (fileSizeBytes <= PLATFORM.stagingMinBytes) return "local";
  if (fileSizeBytes <= PLATFORM.presignedPutMaxBytes) return "presigned_put";
  if (fileSizeBytes <= maxUploadBytes) return "multipart";
  return "multipart";
}

export function pagesPerBatchForTool(toolSlug: string): number {
  if (toolSlug === "ocr-pdf") return PLATFORM.ocrPagesPerBatch;
  if (toolSlug === "compress-pdf") return PLATFORM.compressPagesPerBatch;
  if (toolSlug === "ai-summarize" || toolSlug === "translate-pdf") return PLATFORM.aiPagesPerBatch;
  const profile = getToolProfile(toolSlug);
  if (profile.workerPool === "convert" || profile.workerPool === "docx" || profile.workerPool === "excel") {
    return PLATFORM.convertPagesPerBatch;
  }
  return PLATFORM.convertPagesPerBatch;
}

/** Split 1..N pages into inclusive batches for worker jobs. */
export function buildPageBatches(totalPages: number, batchSize: number): PageBatch[] {
  const safeTotal = Math.max(1, Math.min(totalPages, PLATFORM.maxPagesPremium));
  const size = Math.max(1, batchSize);
  const batches: PageBatch[] = [];
  for (let start = 1; start <= safeTotal; start += size) {
    const end = Math.min(start + size - 1, safeTotal);
    batches.push({ startPage: start, endPage: end, count: end - start + 1 });
  }
  return batches;
}

/**
 * Pre-flight before any tool runs — returns batch plan + upload strategy.
 * Call after page count is known when possible.
 */
export function assessDocumentScale(input: DocumentScaleInput): DocumentScaleAssessment {
  const isPremium = Boolean(input.isPremium);
  const maxFileBytes =
    input.path === "browser" && input.browserLimits
      ? input.browserLimits.maxFileBytes
      : maxFileBytesForPath(input.path, isPremium);
  const maxPages = maxPagesForTool(
    input.path,
    input.toolSlug,
    isPremium,
    input.browserLimits,
  );
  const pages =
    input.pageCount != null && Number.isFinite(input.pageCount) && input.pageCount > 0
      ? Math.floor(input.pageCount)
      : null;

  const tier = sizeTier(input.fileSizeBytes, pages);
  const uploadStrategy = uploadStrategyForFile(
    input.fileSizeBytes,
    input.path === "browser" ? PLATFORM.maxFileBytesBrowser : maxFileBytes,
  );

  if (input.fileSizeBytes > maxFileBytes) {
    return {
      ok: false,
      tier,
      path: input.path,
      uploadStrategy,
      pageBatches: [],
      batched: false,
      maxFileBytes,
      maxPages,
      code: "file_too_large",
      message:
        input.path === "browser"
          ? "This file is too large for browser processing. Use advanced OCR & processing instead."
          : isPremium
            ? "This file exceeds the platform limit. Try splitting the PDF first."
            : "This file needs Premium advanced processing for large documents.",
    };
  }

  if (pages != null && pages > maxPages) {
    return {
      ok: false,
      tier,
      path: input.path,
      uploadStrategy,
      pageBatches: [],
      batched: false,
      maxFileBytes,
      maxPages,
      code: "too_many_pages",
      message:
        input.path === "browser"
          ? "Too many pages for browser mode. Use advanced processing for reliable results."
          : "This document exceeds the page limit for this tool. Split the PDF or upgrade your plan.",
    };
  }

  const effectivePages = pages ?? 1;
  const batchSize = pagesPerBatchForTool(input.toolSlug);
  const pageBatches =
    input.path === "advanced" && effectivePages > batchSize
      ? buildPageBatches(effectivePages, batchSize)
      : [{ startPage: 1, endPage: effectivePages, count: effectivePages }];

  return {
    ok: true,
    tier,
    path: input.path,
    uploadStrategy,
    pageBatches,
    batched: pageBatches.length > 1,
    maxFileBytes,
    maxPages,
  };
}

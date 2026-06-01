import { envString } from "@/server/env";

/** Trusted Cloud AI Plus — strict caps to control API cost. */
export const AI_PLUS_MAX_FILE_MB = Number(envString("AI_PLUS_MAX_FILE_MB", "5")) || 5;
/** Legacy env name — processor uses job page count + AI_PROCESS_MAX_PAGES instead. */
export const AI_PLUS_MAX_PAGES = Number(envString("AI_PLUS_MAX_PAGES", "100")) || 100;
export const AI_PLUS_MAX_FILE_BYTES = AI_PLUS_MAX_FILE_MB * 1024 * 1024;

/** Lifetime AI trial disabled — free tier uses monthly credits instead. */
export const AI_LIFETIME_TRIAL_LIMIT = Number(envString("AI_LIFETIME_TRIAL_LIMIT", "0")) || 0;

/** Small AI jobs → OpenRouter free models (more generous token limits). */
export const AI_SMALL_MAX_PAGES = Number(envString("AI_SMALL_MAX_PAGES", "2")) || 2;
export const AI_SMALL_MAX_CHARS = Number(envString("AI_SMALL_MAX_CHARS", "10000")) || 10000;
export const AI_SMALL_MAX_FILE_MB = Number(envString("AI_SMALL_MAX_FILE_MB", "5")) || 5;

/** OpenRouter — sole AI provider (Phase 1). */
export const OPENROUTER_API_KEY = envString("OPENROUTER_API_KEY");

/**
 * When true (default), all AI jobs try cheap paid models before free tier.
 * Set AI_PREFER_PAID_FIRST=0 to restore free-first routing for small jobs.
 */
export const AI_PREFER_PAID_FIRST = envString("AI_PREFER_PAID_FIRST", "1") !== "0";

/** Primary paid model — verified on OpenRouter May 2026 (gemini-2.0-flash-001 returns 404). */
export const OPENROUTER_MODEL_TRANSLATE =
  envString("OPENROUTER_MODEL_TRANSLATE") ||
  envString("OPENROUTER_MODEL") ||
  "deepseek/deepseek-chat";

export const OPENROUTER_MODEL_SUMMARIZE =
  envString("OPENROUTER_MODEL_SUMMARIZE") || OPENROUTER_MODEL_TRANSLATE;

/** Free OpenRouter models — reliable ones first (May 2026 Railway logs). */
export const OPENROUTER_MODEL_FREE =
  envString("OPENROUTER_MODEL_FREE") || "openai/gpt-oss-20b:free";

/** Timeouts/429 models listed after working free tiers. */
export const OPENROUTER_MODEL_FREE_FALLBACKS =
  envString("OPENROUTER_MODEL_FREE_FALLBACKS") ||
  "nvidia/nemotron-3-nano-30b-a3b:free,meta-llama/llama-3.2-3b-instruct:free,nvidia/nemotron-nano-9b-v2:free,google/gemma-4-26b-a4b-it:free";

/** Cheap paid fallbacks after primary (DeepSeek ≈ lowest $/token; Gemini for quality). */
export const OPENROUTER_FALLBACK_MODELS =
  envString("OPENROUTER_FALLBACK_MODELS") ||
  "google/gemini-2.5-flash,openai/gpt-4o-mini";

/** Removed from chains automatically — OpenRouter returns 404 / no endpoints. */
export const OPENROUTER_DEPRECATED_MODELS = new Set([
  "google/gemini-2.0-flash-001",
  "google/gemini-2.0-flash-exp",
  "google/gemini-2.0-flash-exp:free",
]);

export const OPENROUTER_APP_URL =
  envString("OPENROUTER_APP_URL") || envString("VITE_APP_URL") || "https://www.pdftrusted.com";

export const OPENROUTER_APP_NAME = envString("OPENROUTER_APP_NAME") || "PdfTrusted";

export function isAiConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY?.trim());
}

export const AI_TOOL_SLUGS = new Set([
  "ai-summarize",
  "translate-pdf",
  "chat-pdf",
  "smart-scan-ai",
  "ai-question-gen",
  "ai-rewrite-pdf",
  "ai-resume-builder",
]);

export type AiDocumentProcessingMode = "browser" | "ocr_cloud" | "ai_plus" | "classic_mt";

export function isAiToolSlug(slug: string): boolean {
  return AI_TOOL_SLUGS.has(slug);
}

export function parseProcessingMode(raw: unknown): AiDocumentProcessingMode | null {
  if (raw === "browser" || raw === "ocr_cloud" || raw === "ai_plus" || raw === "classic_mt") return raw;
  return null;
}

import {
  AI_SMALL_MAX_CHARS,
  AI_SMALL_MAX_FILE_MB,
  AI_SMALL_MAX_PAGES,
  OPENROUTER_FALLBACK_MODELS,
  OPENROUTER_MODEL_FREE,
  OPENROUTER_MODEL_FREE_FALLBACKS,
  OPENROUTER_MODEL_SUMMARIZE,
  OPENROUTER_MODEL_TRANSLATE,
} from "@/server/ai/config";

export type AiTask = "translate" | "summarize";

export type ModelRouteInput = {
  task: AiTask;
  pageCount: number;
  totalChars: number;
  fileSizeBytes?: number;
  isPremium?: boolean;
};

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupeChain(ids: string[]): string[] {
  const seen = new Set<string>();
  const chain: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    chain.push(id);
  }
  return chain;
}

export function isSmallAiJob(input: Pick<ModelRouteInput, "pageCount" | "totalChars" | "fileSizeBytes">): boolean {
  const fileOk =
    input.fileSizeBytes == null ||
    input.fileSizeBytes <= AI_SMALL_MAX_FILE_MB * 1024 * 1024;
  return (
    input.pageCount <= AI_SMALL_MAX_PAGES &&
    input.totalChars <= AI_SMALL_MAX_CHARS &&
    fileOk
  );
}

function freeModelChain(): string[] {
  return dedupeChain([OPENROUTER_MODEL_FREE, ...parseList(OPENROUTER_MODEL_FREE_FALLBACKS)]);
}

function paidModelChain(task: AiTask): string[] {
  const primary = task === "translate" ? OPENROUTER_MODEL_TRANSLATE : OPENROUTER_MODEL_SUMMARIZE;
  return dedupeChain([primary, ...parseList(OPENROUTER_FALLBACK_MODELS)]);
}

/**
 * Smart model routing:
 * - Small/simple files → free models first (save cost)
 * - Large/complex files → paid models first (fast + accurate)
 * - Both chains include full fallbacks so nothing ever fails silently
 */
export function modelChainForWorkload(input: ModelRouteInput): string[] {
  if (isSmallAiJob(input)) {
    return dedupeChain([...freeModelChain(), ...paidModelChain(input.task)]);
  }
  return dedupeChain([...paidModelChain(input.task), ...freeModelChain()]);
}

/** @deprecated Use modelChainForWorkload */
export function modelChainForTask(task: AiTask): string[] {
  return paidModelChain(task);
}

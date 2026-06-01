export type AiDocumentProcessingMode = "browser" | "ocr_cloud" | "ai_plus" | "classic_mt";

export type RecommendedTranslateEngine = "classic" | "ai";

/** Translate PDF: keep_layout = overlay on original (iLovePDF-style); text_only = reflow text PDF */
export type TranslateLayoutMode = "keep_layout" | "text_only";

export function aiCloudJobOptions(input: {
  toolSlug: string;
  processingMode: AiDocumentProcessingMode;
  jobType?: "translate" | "summarize" | "question-gen";
  layoutMode?: TranslateLayoutMode;
  sourceLang?: string;
  targetLang?: string;
  sourceLangCode?: string;
  targetLangCode?: string;
  outputLang?: string;
  aiTier?: "standard" | "advanced";
  summaryLength?: "short" | "medium" | "long";
  questionTypes?: string;
  questionCount?: number;
  questionDifficulty?: string;
}): Record<string, unknown> {
  return {
    processingMode: input.processingMode,
    jobType: input.jobType,
    layoutMode: input.layoutMode ?? "keep_layout",
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
    sourceLangCode: input.sourceLangCode,
    targetLangCode: input.targetLangCode,
    outputLang: input.outputLang,
    toolSlug: input.toolSlug,
    aiTier: input.aiTier,
    summaryLength: input.summaryLength,
    questionTypes: input.questionTypes,
    questionCount: input.questionCount,
    questionDifficulty: input.questionDifficulty,
  };
}

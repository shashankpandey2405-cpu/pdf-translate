export type TextBlock = {
  id: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName?: string;
  rotation?: number;
  alignment?: "left" | "center" | "right";
};

export type TranslateAnalyzeResult = {
  isDigital: boolean;
  isScanned: boolean;
  pages: number;
  fonts: string[];
  language: string;
  textCharCount: number;
  avgCharsPerPage: number;
  recommendedEngine: "classic" | "ai";
  reason: string;
};

export type ClassicTranslateJobOptions = {
  sourceLang?: string;
  targetLang?: string;
  sourceLangCode?: string;
  targetLangCode?: string;
  layoutMode?: "keep_layout" | "text_only";
  maxProcessPages?: number;
  isPremium?: boolean;
  toolSlug?: string;
  creditHoldAmount?: number;
  processingMode?: string;
  jobType?: string;
};

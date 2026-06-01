export type BatchTranslateInput = {
  sourceLangCode: string;
  targetLangCode: string;
  texts: string[];
};

export type BatchTranslateResult = {
  translations: string[];
  provider: string;
};

export interface TranslationProvider {
  readonly name: string;
  translateBatch(input: BatchTranslateInput): Promise<BatchTranslateResult>;
  healthCheck(): Promise<boolean>;
}

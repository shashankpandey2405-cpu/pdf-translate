import type {
  BatchTranslateInput,
  BatchTranslateResult,
  TranslationProvider,
} from "@/server/translate/providers/TranslationProvider";

function notConfigured(name: string): TranslationProvider {
  return {
    name,
    async healthCheck() {
      return false;
    },
    async translateBatch(_input: BatchTranslateInput): Promise<BatchTranslateResult> {
      throw new Error(`${name} is not configured. Use classic_mt (open-source) or set up ${name} in a future release.`);
    },
  };
}

export const GoogleTranslationProvider = notConfigured("google");
export const DeepLTranslationProvider = notConfigured("deepl");
export const MicrosoftTranslationProvider = notConfigured("microsoft");

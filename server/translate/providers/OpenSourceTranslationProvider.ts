import {
  CLASSIC_MT_BATCH_SIZE,
  isClassicMtConfigured,
  TRANSLATE_MT_TIMEOUT_MS,
  TRANSLATE_MT_URL,
} from "@/server/translate/config";
import type {
  BatchTranslateInput,
  BatchTranslateResult,
  TranslationProvider,
} from "@/server/translate/providers/TranslationProvider";

export class OpenSourceTranslationProvider implements TranslationProvider {
  readonly name = "opensource";

  async healthCheck(): Promise<boolean> {
    if (!isClassicMtConfigured()) return false;
    try {
      const res = await fetch(`${TRANSLATE_MT_URL}/health`, {
        signal: AbortSignal.timeout(8000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async translateBatch(input: BatchTranslateInput): Promise<BatchTranslateResult> {
    if (!isClassicMtConfigured()) {
      throw new Error(
        "Classic translation service is not configured. Set TRANSLATE_MT_URL to your self-hosted translate-mt service.",
      );
    }

    const { sourceLangCode, targetLangCode, texts } = input;
    if (sourceLangCode === targetLangCode) {
      return { translations: [...texts], provider: "passthrough" };
    }

    const out: string[] = new Array(texts.length);
    for (let i = 0; i < texts.length; i += CLASSIC_MT_BATCH_SIZE) {
      const chunk = texts.slice(i, i + CLASSIC_MT_BATCH_SIZE);
      const res = await fetch(`${TRANSLATE_MT_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: sourceLangCode,
          target: targetLangCode,
          texts: chunk,
        }),
        signal: AbortSignal.timeout(TRANSLATE_MT_TIMEOUT_MS),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(
          `Translation service error (${res.status}): ${errText.slice(0, 200) || res.statusText}`,
        );
      }

      const data = (await res.json()) as { translations?: string[]; provider?: string };
      const translations = data.translations;
      if (!translations || translations.length !== chunk.length) {
        throw new Error("Translation service returned an invalid batch response.");
      }
      for (let j = 0; j < translations.length; j += 1) {
        out[i + j] = translations[j] ?? chunk[j] ?? "";
      }
    }

    return { translations: out, provider: "argos" };
  }
}

let defaultProvider: OpenSourceTranslationProvider | null = null;

export function getOpenSourceTranslationProvider(): OpenSourceTranslationProvider {
  if (!defaultProvider) defaultProvider = new OpenSourceTranslationProvider();
  return defaultProvider;
}

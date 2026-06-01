import { getCachedTranslation, setCachedTranslation } from "@/server/translate/cache/translationCache";
import { getOpenSourceTranslationProvider } from "@/server/translate/providers/OpenSourceTranslationProvider";
import type { TextBlock } from "@/server/translate/types";
import type { TranslatedPdfRun } from "@/server/ai/translatePdfRuns";

export async function translateTextBlocks(
  blocks: TextBlock[],
  sourceLangCode: string,
  targetLangCode: string,
): Promise<TranslatedPdfRun[]> {
  const provider = getOpenSourceTranslationProvider();
  const unique = new Map<string, string>();
  for (const b of blocks) {
    const t = b.text.trim();
    if (t && !unique.has(t)) unique.set(t, t);
  }

  const originals = [...unique.keys()];
  const translatedByOriginal = new Map<string, string>();

  const uncached: string[] = [];
  for (const text of originals) {
    const hit = await getCachedTranslation(sourceLangCode, targetLangCode, text);
    if (hit !== null) translatedByOriginal.set(text, hit);
    else uncached.push(text);
  }

  if (uncached.length > 0) {
    const { translations } = await provider.translateBatch({
      sourceLangCode,
      targetLangCode,
      texts: uncached,
    });
    for (let i = 0; i < uncached.length; i += 1) {
      const src = uncached[i]!;
      const tr = translations[i] ?? src;
      translatedByOriginal.set(src, tr);
      await setCachedTranslation(sourceLangCode, targetLangCode, src, tr);
    }
  }

  return blocks.map((b) => {
    const key = b.text.trim();
    const translated = key ? (translatedByOriginal.get(key) ?? b.text) : b.text;
    return {
      id: b.id,
      pageIndex: b.pageIndex,
      text: b.text,
      translated,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      fontSize: b.fontSize,
    };
  });
}

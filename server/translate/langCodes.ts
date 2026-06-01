/** Map UI language labels or codes to ISO codes for the MT service. */
const LABEL_TO_CODE: Record<string, string> = {
  english: "en",
  hindi: "hi",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  arabic: "ar",
  bengali: "bn",
  urdu: "ur",
  turkish: "tr",
  chinese: "zh",
  japanese: "ja",
  korean: "ko",
  hebrew: "he",
};

export function resolveLangCode(input: string | undefined, fallback = "en"): string {
  if (!input?.trim()) return fallback;
  const raw = input.trim();
  if (/^[a-z]{2}(-[a-z]{2})?$/i.test(raw)) {
    return raw.toLowerCase().split("-")[0]!;
  }
  const key = raw.toLowerCase();
  return LABEL_TO_CODE[key] ?? fallback;
}

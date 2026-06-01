import { resolveLangCode } from "@/server/translate/langCodes";

export type ScriptFamily = "latin" | "devanagari" | "bengali" | "arabic" | "cjk";

export function scriptFamilyForLang(langCode: string): ScriptFamily {
  const c = resolveLangCode(langCode);
  if (["hi", "mr", "ne", "sa"].includes(c)) return "devanagari";
  if (c === "bn") return "bengali";
  if (["ar", "ur", "fa", "ps", "he"].includes(c)) return "arabic";
  if (["zh", "ja", "ko"].includes(c)) return "cjk";
  return "latin";
}

export function isRtlLang(langCode: string): boolean {
  const c = resolveLangCode(langCode);
  return ["ar", "ur", "fa", "he", "ps"].includes(c);
}

/** Map PDF base font names to Noto families for overlay rendering. */
export function mapPdfFontToFamily(pdfFontName: string | undefined, targetLangCode: string): string {
  const script = scriptFamilyForLang(targetLangCode);
  const lower = (pdfFontName ?? "").toLowerCase();

  if (script === "devanagari") return "NotoSansDevanagari";
  if (script === "bengali") return "NotoSansBengali";
  if (script === "arabic") return resolveLangCode(targetLangCode) === "ur" ? "NotoNastaliqUrdu" : "NotoSansArabic";
  if (script === "cjk") return "NotoSansSC";

  if (lower.includes("times") || lower.includes("serif")) return "NotoSerif";
  if (lower.includes("courier") || lower.includes("mono")) return "NotoSansMono";
  return "NotoSans";
}

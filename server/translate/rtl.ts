import { isRtlLang } from "@/server/translate/fontMap";

/** Basic RTL display prep — full shaping uses canvas + Noto in rebuild path. */
export function prepareRtlDisplayText(text: string, targetLangCode: string): string {
  if (!isRtlLang(targetLangCode)) return text;
  // Unicode bidi marks for mixed content; canvas draws right-aligned in rebuild.
  const trimmed = text.trim();
  if (!trimmed) return text;
  return `\u202B${trimmed}\u202C`;
}

export function rtlDrawX(boxX: number, boxWidth: number, textWidth: number, targetLangCode: string): number {
  if (!isRtlLang(targetLangCode)) return boxX;
  return Math.max(boxX, boxX + boxWidth - textWidth);
}

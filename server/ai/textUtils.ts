export const MAX_INPUT_CHARS = 12_000;

export function trimInput(text: string): string {
  if (text.length <= MAX_INPUT_CHARS) return text;
  return `${text.slice(0, MAX_INPUT_CHARS)}\n\n[…truncated for AI limit]`;
}

export function splitTranslatedPages(text: string, expected: number): string[] {
  const parts: string[] = [];
  const re = /---\s*Page\s*(\d+)\s*---/gi;
  const matches = [...text.matchAll(re)];
  if (matches.length === 0) {
    return [text.trim()];
  }
  for (let i = 0; i < matches.length; i += 1) {
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    parts.push(text.slice(start, end).trim());
  }
  while (parts.length < expected) parts.push("");
  return parts.slice(0, expected);
}

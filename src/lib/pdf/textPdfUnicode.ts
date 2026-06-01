/** True when text needs a Unicode-capable font (non Basic Latin). */
export function textNeedsUnicodeFont(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) > 0x024f) return true;
  }
  return false;
}

export function previewField(value: string, placeholder: string): { text: string; isPlaceholder: boolean } {
  const trimmed = value.trim();
  return { text: trimmed || placeholder, isPlaceholder: !trimmed };
}

export function previewClass(isPlaceholder: boolean, extra = ""): string {
  return isPlaceholder ? `italic text-slate-400 ${extra}`.trim() : extra;
}

export function formatDateRange(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

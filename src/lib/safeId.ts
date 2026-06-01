let seq = 0;

/** Client-safe unique id — never relies on crypto.randomUUID (missing on HTTP / older WebViews). */
export function safeId(prefix = "a"): string {
  seq = (seq + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}_${seq}_${Math.random().toString(36).slice(2, 10)}`;
}

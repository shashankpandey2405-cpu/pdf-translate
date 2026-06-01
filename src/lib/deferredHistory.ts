/**
 * Defer history.replaceState so it does not run during React commit / useInsertionEffect.
 * Avoids "useInsertionEffect must not schedule updates" when combined with wouter / Next.js.
 */
export function deferredReplaceState(url: string) {
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      try {
        window.history.replaceState({}, "", url);
      } catch {
        /* ignore */
      }
    });
  });
}

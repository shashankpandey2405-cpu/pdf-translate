/** View Transitions API helper for SPA route changes (Chrome 111+, Safari 18+). */

export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function runViewTransition(update: () => void): void {
  if (!supportsViewTransitions()) {
    update();
    return;
  }
  (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
    update,
  );
}

/** Preload command palette chunk on first search interaction (LCP-friendly). */
let preloaded = false;

export function preloadCommandPalette(): void {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  void import("@/components/command/CommandPalette");
}

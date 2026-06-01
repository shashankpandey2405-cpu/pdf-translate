/** Subscription-gated tools (paid checkout removed — use coming-soon or enhanced cloud quota instead). */

export const PREMIUM_ONLY_SLUGS = new Set<string>([]);

export function isPremiumOnlyTool(slug: string): boolean {
  const key = slug.trim().toLowerCase();
  return PREMIUM_ONLY_SLUGS.has(key);
}

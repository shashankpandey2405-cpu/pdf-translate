import type { ReactNode } from "react";

/**
 * PPR (`experimental_ppr`) requires Next.js canary — enabled via Suspense on the page
 * until we pin a canary build for production.
 */
export default function LocaleLayout({ children }: { children: ReactNode }) {
  return children;
}

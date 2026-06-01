import type { AuthIntent } from "@/context/AuthPromptContext";

export const PRICING_PATH = "/pricing";

/** True when current route is the pricing page (any locale prefix). */
export function isOnPricingPath(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return path === "/pricing" || path.startsWith("/pricing/");
}

export function navigateToPricingIfNeeded(navigate: (path: string) => void): void {
  if (!isOnPricingPath()) navigate(PRICING_PATH);
}

type UpgradeFlowOpts = {
  isSignedIn: boolean;
  requestSignIn: (intent?: AuthIntent) => void;
  navigate: (path: string) => void;
  reason?: string;
};

/** Free limits exhausted: login first, then premium page (never checkout while logged out). */
export function requestUpgradeAfterLimit({
  isSignedIn,
  requestSignIn,
  navigate,
  reason = "Upgrade to Premium to continue.",
}: UpgradeFlowOpts): void {
  if (!isSignedIn) {
    requestSignIn({
      reason,
      returnPath: PRICING_PATH,
      deferredAction: "upgrade",
    });
    return;
  }
  navigateToPricingIfNeeded(navigate);
}

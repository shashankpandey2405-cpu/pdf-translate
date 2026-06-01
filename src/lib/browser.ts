/** Safe browser-only access for SSR / Vercel build. */
export const isBrowser = typeof window !== "undefined";
export const isDocument = typeof document !== "undefined";

export function getWindow(): Window | undefined {
  return isBrowser ? window : undefined;
}

export function getDocument(): Document | undefined {
  return isDocument ? document : undefined;
}

export function getLocationHref(): string {
  if (!isBrowser) return "";
  return window.location.href;
}

export function getLocationPathname(): string {
  if (!isBrowser) return "/";
  return window.location.pathname;
}

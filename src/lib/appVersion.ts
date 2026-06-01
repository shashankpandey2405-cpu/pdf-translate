/** Deploy version for PWA cache busting and update prompts. */
export const APP_VERSION =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_RELEASE?.trim()) ||
  (typeof process !== "undefined" && process.env.VERCEL_GIT_COMMIT_SHA?.trim()) ||
  "20260528.6";

export const SW_URL = `/sw.js?v=${encodeURIComponent(APP_VERSION)}`;

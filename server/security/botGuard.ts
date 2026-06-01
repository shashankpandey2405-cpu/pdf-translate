/**
 * Edge-safe bot / scraper detection (no Redis). Used in middleware + API routes.
 */

const ALLOWED_SEARCH_BOTS = [
  "googlebot",
  "bingbot",
  "applebot",
  "duckduckbot",
  "yandexbot",
  "baiduspider",
];

/** Aggressive crawlers, AI scrapers, and scripted abuse — block on /api. */
const BLOCKED_UA_SUBSTRINGS = [
  "semrush",
  "ahrefs",
  "petalbot",
  "dotbot",
  "bytespider",
  "mj12bot",
  "barkrowler",
  "dataforseo",
  "serpstat",
  "scrapy",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "java/",
  "wget/",
  "curl/",
  "httpclient",
  "headlesschrome",
  "phantomjs",
  "selenium",
  "puppeteer",
  "playwright",
  "postmanruntime",
  "insomnia",
  "webdriver",
  "gptbot",
  "chatgpt-user",
  "ccbot",
  "google-extended",
  "anthropic-ai",
  "claude-web",
  "cohere-ai",
  "node-fetch",
  "undici",
  "axios/",
];

/** Paths bots may hit without blocking (health, auth session). */
export const API_BOT_ALLOW_PATHS = new Set([
  "/api/health",
  "/api/enhanced/health",
  "/api/session",
  "/api/locale-hint",
  "/api/sentry-tunnel",
  "/api/auth",
]);

export function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function getUserAgent(req: Request): string {
  return (req.headers.get("user-agent") ?? "").trim();
}

export function isAllowedSearchBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return ALLOWED_SEARCH_BOTS.some((b) => lower.includes(b));
}

export function isBlockedBotUserAgent(ua: string): boolean {
  if (!ua) return true;
  const lower = ua.toLowerCase();
  if (isAllowedSearchBot(lower)) return false;
  return BLOCKED_UA_SUBSTRINGS.some((s) => lower.includes(s));
}

export function shouldBlockApiRequest(pathname: string, ua: string): boolean {
  if (!pathname.startsWith("/api")) return false;
  for (const prefix of API_BOT_ALLOW_PATHS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return false;
  }
  return isBlockedBotUserAgent(ua);
}

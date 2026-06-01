const VISITS_KEY = "pdftrusted-guest-visits";
const SUCCESSES_KEY = "pdftrusted-guest-successes";
const LAST_TOOL_KEY = "pdftrusted-guest-last-tool";
const SESSION_VISIT_KEY = "pdftrusted-visit-recorded-session";
const WELCOME_SHOWN_PREFIX = "pdftrusted-welcome-shown:";

function readCount(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function writeCount(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(Math.max(0, value)));
}

/** One increment per browser session (tab lifetime). */
export function recordGuestVisit(): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(SESSION_VISIT_KEY) === "1") return;
  window.sessionStorage.setItem(SESSION_VISIT_KEY, "1");
  writeCount(VISITS_KEY, readCount(VISITS_KEY) + 1);
}

export function recordGuestToolSuccess(toolSlug: string): void {
  if (typeof window === "undefined") return;
  writeCount(SUCCESSES_KEY, readCount(SUCCESSES_KEY) + 1);
  try {
    window.localStorage.setItem(LAST_TOOL_KEY, toolSlug);
  } catch {
    /* ignore */
  }
}

export function getGuestEngagement() {
  if (typeof window === "undefined") {
    return { visits: 0, successes: 0, lastTool: null as string | null };
  }
  return {
    visits: readCount(VISITS_KEY),
    successes: readCount(SUCCESSES_KEY),
    lastTool: window.localStorage.getItem(LAST_TOOL_KEY),
  };
}

/** Guest who has returned or completed at least one free tool. */
export function isReturningEngagedGuest(): boolean {
  const { visits, successes } = getGuestEngagement();
  return visits >= 2 || successes >= 1;
}

export function hasShownWelcomeForUser(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(`${WELCOME_SHOWN_PREFIX}${userId}`) === "1";
}

export function markWelcomeShownForUser(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${WELCOME_SHOWN_PREFIX}${userId}`, "1");
  } catch {
    /* ignore */
  }
}

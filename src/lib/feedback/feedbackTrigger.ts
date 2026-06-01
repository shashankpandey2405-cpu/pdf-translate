const DISMISS_KEY = "pdftrusted-feedback-dismiss-until";
const DISMISS_DAYS = 7;

type FeedbackContext = {
  toolName: string;
  pageUrl?: string;
};

type Listener = (ctx: FeedbackContext) => void;

const listeners = new Set<Listener>();

export function isFeedbackModalEnabled(): boolean {
  if (typeof process !== "undefined") {
    const v = process.env.NEXT_PUBLIC_FEEDBACK_MODAL_ENABLED;
    if (v === "false" || v === "0") return false;
  }
  return true;
}

export function isFeedbackDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const until = Number(window.localStorage.getItem(DISMISS_KEY) ?? "0");
    return until > Date.now();
  } catch {
    return false;
  }
}

export function dismissFeedbackModal(days = DISMISS_DAYS): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
  } catch {
    /* noop */
  }
}

export function subscribeFeedbackTrigger(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call after successful download or tool completion. */
export function scheduleFeedbackPrompt(ctx: FeedbackContext): void {
  if (!isFeedbackModalEnabled() || isFeedbackDismissed()) return;
  if (typeof window === "undefined") return;

  const delayMs = 2000 + Math.floor(Math.random() * 3000);
  window.setTimeout(() => {
    for (const fn of listeners) fn(ctx);
  }, delayMs);
}

export function randomFeedbackDelayMs(): number {
  return 2000 + Math.floor(Math.random() * 3000);
}

export { DISMISS_KEY, DISMISS_DAYS };

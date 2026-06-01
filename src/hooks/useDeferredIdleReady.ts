import { useEffect, useState } from "react";

type Options = {
  /** Max wait before mounting deferred UI (ms). */
  timeout?: number;
  /** Mount immediately after first user interaction. */
  onInteraction?: boolean;
};

/**
 * Defer non-critical client UI until the browser is idle — cuts TBT on first paint.
 */
export function useDeferredIdleReady(options: Options = {}): boolean {
  const { timeout = 3500, onInteraction = true } = options;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(markReady, { timeout });
    } else {
      timeoutId = setTimeout(markReady, Math.min(timeout, 2000));
    }

    const onInput = () => markReady();
    const opts: AddEventListenerOptions = { once: true, passive: true };
    if (onInteraction) {
      window.addEventListener("pointerdown", onInput, opts);
      window.addEventListener("keydown", onInput, opts);
      window.addEventListener("scroll", onInput, opts);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [ready, timeout, onInteraction]);

  return ready;
}

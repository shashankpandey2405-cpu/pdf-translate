/**
 * Pre-patch history.pushState/replaceState before wouter loads so location events
 * dispatch on the next microtask. Prevents "useInsertionEffect must not schedule updates"
 * when Next.js App Router and wouter both react to replaceState during commit.
 */
const patchKey = Symbol.for("wouter_v3");

if (typeof window !== "undefined" && typeof history !== "undefined") {
  const win = window as unknown as Record<symbol, boolean | undefined>;
  if (win[patchKey] !== true) {
    for (const type of ["pushState", "replaceState"] as const) {
      const original = history[type].bind(history);
      history[type] = function (...args: Parameters<History["pushState"]>) {
        const result = original(...args);
        queueMicrotask(() => {
          const event = new Event(type);
          (event as Event & { arguments?: unknown[] }).arguments = args;
          dispatchEvent(event);
        });
        return result;
      };
    }
    Object.defineProperty(window, patchKey, { value: true, configurable: true });
  }
}

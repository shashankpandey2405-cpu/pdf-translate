/**
 * Browsers do not emit events for history.pushState/replaceState by default.
 * Our SPA router listens to URL changes, so we dispatch lightweight custom events
 * when navigation happens programmatically.
 */
export function installLocationChangeEvents() {
  if (typeof window === "undefined") return;
  const key = "__pdftrusted_location_events_installed__";
  const w = window as unknown as Record<string, unknown>;
  if (w[key] === true) return;
  w[key] = true;

  const { history } = window;
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  function notify(type: "pushState" | "replaceState") {
    try {
      window.dispatchEvent(new Event(type));
      window.dispatchEvent(new Event("locationchange"));
    } catch {
      /* ignore */
    }
  }

  history.pushState = ((...args: Parameters<History["pushState"]>) => {
    const ret = originalPush(...args);
    notify("pushState");
    return ret;
  }) as History["pushState"];

  history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
    const ret = originalReplace(...args);
    notify("replaceState");
    return ret;
  }) as History["replaceState"];
}


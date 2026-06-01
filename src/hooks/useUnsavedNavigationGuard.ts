"use client";

import { useEffect } from "react";

/**
 * Warns on tab close / refresh when there are unsaved edits.
 * Optionally confirms browser back (popstate) when dirty.
 */
export function useUnsavedNavigationGuard(
  dirty: boolean,
  options?: { confirmPopstate?: boolean; message?: string },
) {
  const message = options?.message ?? "You have unsaved changes. Leave anyway?";

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, message]);

  useEffect(() => {
    if (!dirty || !options?.confirmPopstate) return;

    const onPopState = () => {
      if (!window.confirm(message)) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty, message, options?.confirmPopstate]);
}

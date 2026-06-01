"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";
import { APP_VERSION, SW_URL } from "@/lib/appVersion";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "pdftrusted-pwa-update-dismiss";

export function PwaUpdatePrompt() {
  const hydrated = useHydrated();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      setHidden(window.localStorage.getItem(DISMISS_KEY) === APP_VERSION);
    } catch {
      setHidden(false);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
        if (reg.waiting) setWaiting(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(worker);
            }
          });
        });
      } catch {
        /* SW optional — app works without it */
      }
    };

    void register();
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, [hydrated]);

  const applyUpdate = useCallback(() => {
    waiting?.postMessage({ type: "SKIP_WAITING" });
    setWaiting(null);
  }, [waiting]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, []);

  if (!hydrated || !waiting || hidden) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed z-[45] flex max-w-2xl flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between",
        "left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-4",
        "supports-[backdrop-filter]:bg-amber-500/5",
      )}
      role="region"
      aria-live="polite"
      aria-label="App update available"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Update available</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Refresh for the latest PDFTrusted (v{APP_VERSION}).
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 touch-manipulation"
        >
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          Update now
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted touch-manipulation"
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          Later
        </button>
      </div>
    </div>
  );
}

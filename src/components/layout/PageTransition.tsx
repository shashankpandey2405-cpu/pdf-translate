"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supportsViewTransitions } from "@/lib/viewTransition";

/** Route shell with View Transitions API + CSS fallback when routeKey changes. */
export function PageTransition({
  children,
  routeKey,
}: {
  children: ReactNode;
  routeKey?: string;
}) {
  const prevKey = useRef(routeKey);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!routeKey || prevKey.current === routeKey) {
      prevKey.current = routeKey;
      return;
    }
    prevKey.current = routeKey;

    const root = rootRef.current;
    if (!root) return;

    if (supportsViewTransitions()) {
      root.classList.add("page-vt-active");
      const onFinish = () => root.classList.remove("page-vt-active");
      root.addEventListener("transitionend", onFinish, { once: true });
      return () => root.classList.remove("page-vt-active");
    }

    root.classList.add("page-enter");
    const timer = window.setTimeout(() => root.classList.remove("page-enter"), 280);
    return () => window.clearTimeout(timer);
  }, [routeKey]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "view-transition-root flex min-h-0 flex-1 flex-col overflow-visible",
        "mobile-scroll-contain",
      )}
      style={{ viewTransitionName: "page-content" } as React.CSSProperties}
      data-route={routeKey ?? "home"}
    >
      {children}
    </div>
  );
}

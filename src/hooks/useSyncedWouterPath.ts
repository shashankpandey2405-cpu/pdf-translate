"use client";

import { useSyncExternalStore } from "react";

const NAV_EVENTS = ["popstate", "pushState", "replaceState", "hashchange", "locationchange"] as const;

function subscribeToPathname(callback: () => void) {
  for (const event of NAV_EVENTS) {
    addEventListener(event, callback);
  }
  return () => {
    for (const event of NAV_EVENTS) {
      removeEventListener(event, callback);
    }
  };
}

function stripLocaleBase(base: string, pathname: string): string {
  const normalizedBase = base === "/" ? "" : base;
  if (!normalizedBase) return pathname || "/";
  const lowerPath = pathname.toLowerCase();
  const lowerBase = normalizedBase.toLowerCase();
  if (lowerPath === lowerBase || lowerPath === `${lowerBase}/`) return "/";
  if (lowerPath.startsWith(`${lowerBase}/`)) {
    const rest = pathname.slice(normalizedBase.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname || "/";
}

function readPath(base: string): string {
  if (typeof window === "undefined") return "/";
  const path = stripLocaleBase(base, window.location.pathname);
  const q = path.indexOf("?");
  const h = path.indexOf("#");
  const end = q === -1 ? (h === -1 ? path.length : h) : q;
  return path.slice(0, end) || "/";
}

/**
 * Path relative to Wouter's locale base, synced from the real browser URL.
 * Use as Switch `location` so routes update even if Wouter's internal hook is stale.
 */
export function useSyncedWouterPath(base: string): string {
  return useSyncExternalStore(
    subscribeToPathname,
    () => readPath(base),
    () => "/",
  );
}

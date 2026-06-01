"use client";

import { useEffect } from "react";

/**
 * Keeps the server-rendered #home-ssr-hero from stacking under SPA routes.
 * Hidden on any non-home route; client home hero still uses data-home-hydrated.
 */
export function SsrHomeHeroSync({ isHomeRoute }: { isHomeRoute: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.getElementById("home-ssr-hero");
    root.setAttribute("data-route-home", isHomeRoute ? "true" : "false");

    if (!hero) return;

    if (isHomeRoute) {
      hero.removeAttribute("aria-hidden");
      hero.style.removeProperty("display");
    } else {
      hero.setAttribute("aria-hidden", "true");
      hero.style.display = "none";
    }
  }, [isHomeRoute]);

  return null;
}

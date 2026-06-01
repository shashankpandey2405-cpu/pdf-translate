"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";

/**
 * Renders only one layout branch after hydrate (mobile OR desktop).
 * Avoids mounting duplicate tool trees — lowers TBT on tool routes vs CSS-only hide.
 */
export function ToolPageSplit({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  const hydrated = useHydrated();
  const isLg = useIsLgDesktop();

  if (!hydrated) {
    return <div className="min-w-0">{mobile}</div>;
  }

  return isLg ? <div className="min-w-0">{desktop}</div> : <div className="min-w-0">{mobile}</div>;
}

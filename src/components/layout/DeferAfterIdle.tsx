"use client";

import type { ReactNode } from "react";
import { useDeferredIdleReady } from "@/hooks/useDeferredIdleReady";

type Props = {
  children: ReactNode;
  timeout?: number;
  onInteraction?: boolean;
};

/** Mount children after idle — keeps conversion/monitoring overlays off the critical path. */
export function DeferAfterIdle({ children, timeout, onInteraction }: Props) {
  const ready = useDeferredIdleReady({ timeout, onInteraction });
  if (!ready) return null;
  return children;
}

"use client";

import { useEffect } from "react";
import { ConversionVisitTracker } from "@/components/conversion/ConversionVisitTracker";
import { useDeferredIdleReady } from "@/hooks/useDeferredIdleReady";
import { getOrCreateGuestSessionId } from "@/lib/guestSession";

export function GuestSessionInit() {
  const ready = useDeferredIdleReady({ timeout: 4000 });
  useEffect(() => {
    if (ready) void getOrCreateGuestSessionId();
  }, [ready]);
  if (!ready) return null;
  return <ConversionVisitTracker />;
}

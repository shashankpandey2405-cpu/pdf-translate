"use client";

import { useEffect } from "react";
import { recordGuestVisit } from "@/lib/conversion/guestEngagement";
import { logConversionEvent } from "@/utils/logger";

/** Records guest session visits for returning-user prompts (Phase 4). */
export function ConversionVisitTracker() {
  useEffect(() => {
    recordGuestVisit();
    logConversionEvent("session_start");
  }, []);
  return null;
}

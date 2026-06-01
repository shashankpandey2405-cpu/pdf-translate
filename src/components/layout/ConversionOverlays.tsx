"use client";

import { ExitIntentPrompt } from "@/components/ExitIntentPrompt";
import { GuestIdleToolNudge } from "@/components/conversion/GuestIdleToolNudge";
import { ShareAfterDownloadNudge } from "@/components/conversion/ShareAfterDownloadNudge";

export function ConversionOverlays() {
  return (
    <>
      <ExitIntentPrompt />
      <GuestIdleToolNudge />
      <ShareAfterDownloadNudge />
    </>
  );
}

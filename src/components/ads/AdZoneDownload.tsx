"use client";

import AdSlot from "@/components/AdSlot";

/** Bottom banner near download / result panels (tool workflow “done” phase). */
export function AdZoneDownload({ hideAds }: { hideAds?: boolean }) {
  return <AdSlot type="bottom_banner" hideAds={hideAds} className="mt-6 w-full max-w-full" />;
}

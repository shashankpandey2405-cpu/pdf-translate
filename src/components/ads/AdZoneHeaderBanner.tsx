"use client";

import { useLocation } from "wouter";
import AdSlot from "@/components/AdSlot";
import { isHeaderBannerPath } from "@/lib/adPlacement";

/** Horizontal slot below navbar — informational pages only (tool-first: no ads near upload). */
export function AdZoneHeaderBanner() {
  const [loc] = useLocation();
  if (!isHeaderBannerPath(loc)) return null;
  return (
    <div className="w-full border-b border-border/40 bg-muted/15 py-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot type="top_banner" className="max-w-4xl mx-auto" />
      </div>
    </div>
  );
}

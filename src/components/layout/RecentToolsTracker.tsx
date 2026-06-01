"use client";

import { useEffect } from "react";
import { useLocation } from "wouter";
import { isToolLive } from "../../../constants/toolStatus";
import { recordRecentToolSlug } from "@/lib/recentTools";

/** Records tool slug visits for homepage "Recently used". */
export function RecentToolsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.replace(/^\/[a-z]{2}(?=\/|$)/, "").replace(/^\//, "");
    const slug = path.split("/")[0] ?? "";
    if (slug && isToolLive(slug)) {
      recordRecentToolSlug(slug);
    }
  }, [location]);

  return null;
}

"use client";

import { useEffect } from "react";
import { flushRegisteredStagedKeysSyncBestEffort } from "@/lib/stagedFileRegistry";

export function StagedKeysLifecycle() {
  useEffect(() => {
    const onBeforeUnload = () => flushRegisteredStagedKeysSyncBestEffort();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushRegisteredStagedKeysSyncBestEffort();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}

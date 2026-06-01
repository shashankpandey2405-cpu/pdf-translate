"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDeviceCapability } from "@/lib/deviceCapability";

const DISMISS_KEY = "pdftrusted-device-opt-dismiss";

export function DeviceOptimizedBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getDeviceCapability().tier !== "low") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="pointer-events-auto fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[34] mx-auto max-w-7xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6"
    >
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm text-foreground shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>{t("device.optimizedPreview")}</p>
        <button
          type="button"
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
        >
          {t("device.dismiss", { defaultValue: "Dismiss" })}
        </button>
      </div>
      </div>
    </div>
  );
}

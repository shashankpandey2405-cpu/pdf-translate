"use client";

import "@/lib/wouterDeferredHistory";
import { useEffect } from "react";
import App from "@/App";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PwaUpdatePrompt } from "@/components/PwaUpdatePrompt";
import type { LocaleCode } from "@/lib/seo/site";
import { installLocationChangeEvents } from "@/lib/locationEvents";
import { DeferAfterIdle } from "@/components/layout/DeferAfterIdle";
import { initMonitoring } from "@/utils/logger";

type Props = {
  initialLocale: LocaleCode;
  ssrPath: string;
  ssrSearch?: string;
};

export default function NextAppShell({
  initialLocale,
  ssrPath,
  ssrSearch = "",
}: Props) {
  useEffect(() => {
    installLocationChangeEvents();
    const boot = () => initMonitoring();
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(boot, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(boot, 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AppErrorBoundary>
      <App
        initialLocale={initialLocale}
        ssrPath={ssrPath}
        ssrSearch={ssrSearch}
      />
      <DeferAfterIdle timeout={5000}>
        <PwaUpdatePrompt />
      </DeferAfterIdle>
    </AppErrorBoundary>
  );
}

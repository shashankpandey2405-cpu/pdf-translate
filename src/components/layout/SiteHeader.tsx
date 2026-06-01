"use client";

import { Suspense, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { AuthSessionSync } from "@/components/auth/AuthSessionSync";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { ReturningGuestBanner } from "@/components/conversion/ReturningGuestBanner";
import { DeviceOptimizedBanner } from "@/components/device/DeviceOptimizedBanner";
import { DeferAfterIdle } from "@/components/layout/DeferAfterIdle";
import { RecentToolsTracker } from "@/components/layout/RecentToolsTracker";
import { MonitoringRouteListener } from "@/components/MonitoringRouteListener";
import ScrollToTop from "@/components/ScrollToTop";
import { isDesktopToolRoute } from "@/lib/desktop/isDesktopToolRoute";
import { useSyncedWouterPath } from "@/hooks/useSyncedWouterPath";
import { useLocation } from "wouter";
import type { LocaleCode } from "@/lib/seo/site";
import { lazy } from "react";

const CommandPalette = lazy(() =>
  import("@/components/command/CommandPalette").then((mod) => ({ default: mod.CommandPalette })),
);

const DesktopTopNav = lazy(() =>
  import("@/components/desktop/DesktopTopNav").then((mod) => ({ default: mod.DesktopTopNav })),
);

type Props = {
  uiLang: LocaleCode;
};

/** Site navigation + global banners — rendered outside `<main>` (SSR + CSR). */
export function SiteHeader({ uiLang }: Props) {
  const [wouterLocation] = useLocation();
  const routerBase = `/${uiLang}`;
  const syncedPath = useSyncedWouterPath(routerBase);
  const activePath = syncedPath || wouterLocation;
  const desktopToolChrome = isDesktopToolRoute(activePath);

  return (
    <>
      <div className="lg:hidden">
        <Navbar />
      </div>
      <Suspense fallback={null}>
        <DesktopTopNav />
      </Suspense>
      <AuthSessionSync />
      <DeferAfterIdle timeout={3000}>
        <MonitoringRouteListener />
        <RecentToolsTracker />
      </DeferAfterIdle>
      {!desktopToolChrome && (
        <div className="app-shell pointer-events-none relative mx-auto w-full min-w-0 max-w-7xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6">
          <DeviceOptimizedBanner />
          <PwaInstallBanner />
          <CookieConsentBanner />
        </div>
      )}
      <ReturningGuestBanner />
      <ScrollToTop />
      <DeferAfterIdle timeout={2500}>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </DeferAfterIdle>
    </>
  );
}

/** Optional chrome slot for conversion overlays (inside providers, outside main). */
export function SiteHeaderOverlays({ hydrated }: { hydrated: boolean }) {
  if (!hydrated) return null;
  return (
    <DeferAfterIdle timeout={3500}>
      <LazyConversionOverlays />
    </DeferAfterIdle>
  );
}

const LazyConversionOverlays = lazy(() =>
  import("@/components/layout/ConversionOverlays").then((m) => ({ default: m.ConversionOverlays })),
);
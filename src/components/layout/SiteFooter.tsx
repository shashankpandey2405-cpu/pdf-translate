"use client";

import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { isDesktopToolRoute } from "@/lib/desktop/isDesktopToolRoute";
import { useSyncedWouterPath } from "@/hooks/useSyncedWouterPath";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { LocaleCode } from "@/lib/seo/site";

type Props = {
  uiLang: LocaleCode;
};

/** Site footer + mobile dock — outside `<main>`. */
export function SiteFooter({ uiLang }: Props) {
  const [wouterLocation] = useLocation();
  const routerBase = `/${uiLang}`;
  const syncedPath = useSyncedWouterPath(routerBase);
  const activePath = syncedPath || wouterLocation;
  const desktopToolChrome = isDesktopToolRoute(activePath);

  return (
    <>
      <div className={cn(desktopToolChrome && "lg:hidden")}>
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}

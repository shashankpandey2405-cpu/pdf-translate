import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { usePremium } from "@/context/PremiumContext";
import { InstallModal } from "@/components/pwa/InstallModal";
import { cn } from "@/lib/utils";
import { setExitIntentSuppressed } from "@/lib/overlayGate";
import { useOverlaySlot } from "@/context/OverlayPriorityContext";

const DISMISS_KEY = "pdftrusted-pwa-banner-dismiss";
const ENGAGEMENT_DELAY_MS = 45_000;
const MIN_PAGE_VIEWS = 2;
const PAGE_VIEW_KEY = "pdftrusted-pwa-pageviews";

export function PwaInstallBanner() {
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  const { standalone, canPrompt, isIosSafari, promptInstall, isEffectivelyInstalled } = usePwaInstall();
  const hydrated = useHydrated();
  const [hidden, setHidden] = useState(true);
  const engagementReady = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch { /* noop */ }

    const views = parseInt(sessionStorage.getItem(PAGE_VIEW_KEY) ?? "0", 10) + 1;
    sessionStorage.setItem(PAGE_VIEW_KEY, String(views));

    if (views < MIN_PAGE_VIEWS) return;

    const timer = setTimeout(() => {
      engagementReady.current = true;
      setHidden(false);
    }, ENGAGEMENT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [hydrated]);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setExitIntentSuppressed(modalOpen);
    return () => setExitIntentSuppressed(false);
  }, [modalOpen]);

  const wantsOpen = useMemo(
    () => !isPremium && !standalone && !isEffectivelyInstalled && !hidden,
    [isPremium, standalone, isEffectivelyInstalled, hidden],
  );
  const { visible: slotVisible } = useOverlaySlot("pwaInstall", wantsOpen);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setHidden(true);
  }, []);

  const onInstall = useCallback(async () => {
    if (canPrompt && !isIosSafari) {
      await promptInstall();
      return;
    }
    setModalOpen(true);
  }, [canPrompt, isIosSafari, promptInstall]);

  if (!hydrated || !wantsOpen || !slotVisible) return null;

  return (
    <>
      <div
        className={cn(
          "pointer-events-auto fixed z-40 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:hidden",
          "left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] top-[calc(4rem+env(safe-area-inset-top))] max-w-7xl sm:mx-auto",
          "supports-[backdrop-filter]:bg-primary/5"
        )}
        role="region"
        aria-label={t("pwaInstall.bannerAria")}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{t("pwaInstall.bannerTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("pwaInstall.bannerDesc")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onInstall()}
            className="min-h-[44px] rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:text-sm touch-manipulation"
          >
            {t("pwaInstall.bannerInstall")}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted sm:text-sm touch-manipulation"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {t("pwaInstall.bannerDismiss")}
          </button>
        </div>
      </div>

      <InstallModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

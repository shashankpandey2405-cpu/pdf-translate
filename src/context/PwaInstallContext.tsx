"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BeforeInstallPromptEventInner } from "@/hooks/usePwaInstall";

type PwaInstallContextValue = {
  isEffectivelyInstalled: boolean;
  standalone: boolean;
  canPrompt: boolean;
  isIosSafari: boolean;
  promptInstall: () => Promise<{ outcome: "accepted" | "dismissed" | "unavailable" }>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function getStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq.matches || iosStandalone;
}

function detectIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/i.test(ua);
  const notOtherEngines = !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|Brave/i.test(ua);
  return iOS && webkit && notOtherEngines;
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventInner | null>(null);
  const [installedThisSession, setInstalledThisSession] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    setIsIosSafari(detectIosSafari());
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEventInner);
    };
    const onInstalled = () => {
      setInstalledThisSession(true);
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => setStandalone(getStandalone());
    mq.addEventListener("change", onMq);
    setStandalone(getStandalone());
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return { outcome: "unavailable" as const };
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return { outcome: choice.outcome };
  }, [deferred]);

  const value = useMemo(
    () => ({
      isEffectivelyInstalled: standalone || installedThisSession,
      standalone,
      canPrompt: deferred !== null,
      isIosSafari,
      promptInstall,
    }),
    [standalone, installedThisSession, deferred, isIosSafari, promptInstall],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstallContext() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error("usePwaInstallContext must be used within PwaInstallProvider");
  return ctx;
}

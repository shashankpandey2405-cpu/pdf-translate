"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share, Smartphone, Monitor, Apple } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstallContext } from "@/context/PwaInstallContext";
import { cn } from "@/lib/utils";

type Platform = "android" | "ios" | "desktop";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InstallModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { canPrompt, isIosSafari, promptInstall, isEffectivelyInstalled } = usePwaInstallContext();
  const [platform, setPlatform] = useState<Platform>("android");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isIosSafari) setPlatform("ios");
  }, [isIosSafari]);

  async function handleNativeInstall() {
    if (!canPrompt) return;
    setInstalling(true);
    try {
      const result = await promptInstall();
      if (result.outcome === "accepted") {
        onOpenChange(false);
      }
    } finally {
      setInstalling(false);
    }
  }

  const tabs: { id: Platform; label: string; icon: typeof Smartphone }[] = [
    { id: "android", label: t("pwaInstall.platformAndroid", { defaultValue: "Android" }), icon: Smartphone },
    { id: "ios", label: t("pwaInstall.platformIos", { defaultValue: "iPhone / iPad" }), icon: Apple },
    { id: "desktop", label: t("pwaInstall.platformDesktop", { defaultValue: "Web / Desktop" }), icon: Monitor },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pwaInstall.modalTitle")}</DialogTitle>
          <DialogDescription>
            {isEffectivelyInstalled
              ? t("pwaInstall.labelInstalled", { defaultValue: "App installed" })
              : t("pwaInstall.modalPickPlatform", {
                  defaultValue: "Choose your device to install PDFTrusted.",
                })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-2xl border border-border bg-muted/40 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlatform(tab.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
                platform === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          ))}
        </div>

        {platform === "android" && (
          <div className="space-y-4">
            {canPrompt ? (
              <button
                type="button"
                disabled={installing}
                onClick={() => void handleNativeInstall()}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {t("pwaInstall.tryInstall")}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("pwaInstall.androidChromeHint")}</p>
            )}
          </div>
        )}

        {platform === "ios" && (
          <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground">
            <li>{t("pwaInstall.iosStep1")}</li>
            <li className="flex flex-wrap items-center gap-2">
              <Share className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("pwaInstall.iosStep2")}
            </li>
            <li>{t("pwaInstall.iosStep3")}</li>
            <li>{t("pwaInstall.iosStep4")}</li>
          </ol>
        )}

        {platform === "desktop" && (
          <div className="space-y-4">
            {canPrompt ? (
              <button
                type="button"
                disabled={installing}
                onClick={() => void handleNativeInstall()}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {t("pwaInstall.tryInstall")}
              </button>
            ) : null}
            <p className="text-sm text-muted-foreground">{t("pwaInstall.desktopHint")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Smartphone, Download, Share, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import ToolSEO from "@/components/ToolSEO";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function GetApp() {
  const { t, i18n } = useTranslation();
  const { isIosSafari } = usePwaInstall();

  return (
    <AppPageShell className="py-12 sm:py-16">
      <ToolSEO
        title={t("getApp.seoTitle", { defaultValue: "Install PDFTrusted App" })}
        description={t("getApp.seoDescription", {
          defaultValue: "Install PDFTrusted as a fast app on Android, iPhone, or desktop.",
        })}
        slug="get-app"
        lang={i18n.language}
      />
      <h1 className="text-3xl font-bold text-foreground">
        {t("getApp.title", { defaultValue: "Get the PDFTrusted app" })}
      </h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        {t("getApp.subtitle", {
          defaultValue:
            "Install PDFTrusted for an app-like experience: quick access, offline shell, and the same browser + Premium cloud tools.",
        })}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <PwaInstallButton className="min-h-[48px] touch-manipulation" />
      </div>

      <section className="mt-10 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Smartphone className="h-5 w-5 text-primary" />
            {t("getApp.androidTitle", { defaultValue: "Android" })}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("getApp.androidDesc", {
              defaultValue: "Tap Install — Chrome will add PDFTrusted to your home screen in one step.",
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Share className="h-5 w-5 text-primary" />
            {t("getApp.iosTitle", { defaultValue: "iPhone & iPad" })}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("getApp.iosDesc", {
              defaultValue: "Tap Share, then Add to Home Screen. Open PDFTrusted from your home screen like a native app.",
            })}
          </p>
          {isIosSafari ? (
            <ol className="mt-3 list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>{t("getApp.iosStep1", { defaultValue: "Open this site in Safari" })}</li>
              <li>{t("getApp.iosStep2", { defaultValue: "Tap Share at the bottom" })}</li>
              <li>{t("getApp.iosStep3", { defaultValue: "Tap Add to Home Screen" })}</li>
            </ol>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Monitor className="h-5 w-5 text-primary" />
            {t("getApp.desktopTitle", { defaultValue: "Desktop" })}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("getApp.desktopDesc", {
              defaultValue: "Use Install in Chrome or Edge for a standalone window without browser tabs.",
            })}
          </p>
        </div>
      </section>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Download className="h-4 w-4" />
        {t("getApp.offlineNote", {
          defaultValue: "Core PDF tools run in your browser; Premium cloud jobs need a connection.",
        })}
      </p>
    </AppPageShell>
  );
}

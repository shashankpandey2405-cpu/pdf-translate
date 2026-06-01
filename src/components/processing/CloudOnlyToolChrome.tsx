"use client";

import type { ReactNode } from "react";
import { Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHydrated } from "@/hooks/useHydrated";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import { toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";

type Props = {
  toolSlug: string;
  children: ReactNode;
};

/** Turbo Cloud-only tools — upload first, sign in when user taps Process. */
export function CloudOnlyToolChrome({ toolSlug, children }: Props) {
  const hydrated = useHydrated();
  const { t } = useTranslation();
  const { enabled } = useProcessingMode();
  const { isSignedIn } = usePremium();
  const cloudReady = toolSupportsCloudProcessing(toolSlug);

  if (!hydrated || !enabled) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Cloud className="h-3.5 w-3.5" aria-hidden />
            {t("processing.cloudAdvancedBadge", { defaultValue: "Turbo Cloud tool" })}
          </span>
          {!cloudReady ? (
            <span className="text-xs text-muted-foreground">
              {t("processing.cloudLaunchingSoon", {
                defaultValue: "Turbo Cloud for this format is launching soon.",
              })}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {isSignedIn
            ? t("processing.cloudOnlyDescSignedIn", {
                defaultValue: "Upload your PDF, then tap Process — runs on secure Turbo Cloud workers.",
              })
            : t("processing.cloudOnlyDesc", {
                defaultValue:
                  "Upload first — no signup wall. Continue with Google when you tap Process (+ 10 credits/month).",
              })}
        </p>
      </div>
      {children}
    </div>
  );
}

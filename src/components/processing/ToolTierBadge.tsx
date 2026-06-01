"use client";

import { cn } from "@/lib/utils";
import { getToolProcessingBadge } from "@/lib/processing/toolProfiles";
import { useTranslation } from "react-i18next";

type Props = {
  slug: string;
  className?: string;
};

const STYLES: Record<ReturnType<typeof getToolProcessingBadge>, string> = {
  browser: "bg-muted text-muted-foreground",
  hybrid: "bg-primary/10 text-primary",
  cloud_premium: "bg-primary text-primary-foreground",
  cloud_soon: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
};

export function ToolTierBadge({ slug, className }: Props) {
  const { t } = useTranslation();
  const kind = getToolProcessingBadge(slug);
  const label =
    kind === "cloud_premium"
      ? t("tools.badge.cloud", { defaultValue: "Secure cloud" })
      : kind === "cloud_soon"
        ? t("tools.badge.comingSoon", { defaultValue: "Coming soon" })
        : kind === "hybrid"
          ? t("tools.badge.browserCloud", { defaultValue: "Browser or cloud" })
          : t("tools.badge.browser", { defaultValue: "Browser" });

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STYLES[kind],
        className,
      )}
    >
      {label}
    </span>
  );
}

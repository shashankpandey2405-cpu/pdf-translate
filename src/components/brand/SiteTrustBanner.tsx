"use client";

import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Site-wide one-liner: browser-first + optional cloud — use under nav or tool headers. */
export function SiteTrustBanner({ className, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center",
        compact ? "text-[11px]" : "text-xs sm:text-sm",
        className,
      )}
    >
      <Shield className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <span className="text-muted-foreground">
        {t("brand.trustBanner", {
          defaultValue:
            "Many tools run in your browser — files often never leave your device. Heavy jobs use free Trusted Cloud.",
        })}
      </span>
      <Link href="/compare" className="font-medium text-primary hover:underline">
        {t("brand.compareLink", { defaultValue: "See comparisons" })}
      </Link>
    </div>
  );
}

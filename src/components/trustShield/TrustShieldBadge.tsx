"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTrustShield } from "@/context/TrustShieldContext";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function TrustShieldBadge({ className, compact }: Props) {
  const { t } = useTranslation();
  const { privacyFirst, badgeLabel } = useTrustShield();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300",
        className,
      )}
      role="status"
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{badgeLabel}</span>
      {!compact && (
        <span className="font-normal text-emerald-800/80 dark:text-emerald-200/80">
          ·{" "}
          {privacyFirst
            ? t("trustShield.ramOnly", { defaultValue: "RAM-only in Normal mode" })
            : t("trustShield.hybrid", { defaultValue: "Browser-first processing" })}
        </span>
      )}
    </div>
  );
}

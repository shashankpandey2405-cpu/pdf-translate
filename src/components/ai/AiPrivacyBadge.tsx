"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  sticky?: boolean;
};

export function AiPrivacyBadge({ className, sticky = false }: Props) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300",
        sticky && "sticky top-14 z-20 mb-3 w-fit backdrop-blur-md",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("ai.privacyBadge", {
        defaultValue: "Privacy Verified: Neural processing happens on your device.",
      })}
    </div>
  );
}

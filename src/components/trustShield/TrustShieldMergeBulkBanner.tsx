"use client";

import { Files } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTrustShield } from "@/context/TrustShieldContext";
import { cn } from "@/lib/utils";

type Props = {
  fileCount: number;
  className?: string;
};

/** Privacy-First merge limit — up to 100 PDFs in-browser (no cloud staging). */
export function TrustShieldMergeBulkBanner({ fileCount, className }: Props) {
  const { t } = useTranslation();
  const { privacyFirst, bulkMaxFiles } = useTrustShield();

  if (!privacyFirst || fileCount === 0) return null;

  const atLimit = fileCount >= bulkMaxFiles;
  const nearLimit = fileCount >= bulkMaxFiles - 5;

  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex gap-3 rounded-2xl border px-4 py-3 text-sm",
        atLimit
          ? "border-destructive/35 bg-destructive/10 text-destructive"
          : nearLimit
            ? "border-amber-500/35 bg-amber-500/10 text-foreground"
            : "border-primary/25 bg-primary/5 text-foreground",
        className,
      )}
    >
      <Files className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {t("trustShield.mergeBulkTitle", {
            defaultValue: "Privacy-First merge — up to {{max}} PDFs in your browser",
            max: bulkMaxFiles,
          })}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t("trustShield.mergeBulkBody", {
            defaultValue:
              "Files stay in RAM only; cloud staging is off. Add PDFs in order, then merge — no upload to our servers.",
          })}
        </p>
        <p
          className={cn(
            "mt-2 text-xs font-semibold tabular-nums",
            atLimit ? "text-destructive" : nearLimit ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground",
          )}
        >
          {t("trustShield.mergeBulkCount", {
            defaultValue: "{{count}} / {{max}} files selected",
            count: fileCount,
            max: bulkMaxFiles,
          })}
        </p>
      </div>
    </div>
  );
}

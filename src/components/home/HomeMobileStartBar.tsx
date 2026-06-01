"use client";

import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/components/premium/PremiumButton";

/** Sticky thumb-zone CTA on mobile home — sits above bottom nav. */
export function HomeMobileStartBar() {
  const { t } = useTranslation();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 px-4 lg:hidden"
      style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto mx-auto max-w-lg">
        <PremiumButton
          href="/merge-pdf"
          className="flex min-h-[52px] w-full items-center justify-center gap-2 shadow-[0_8px_32px_rgb(79,70,229,0.45)]"
        >
          <Upload className="h-5 w-5" aria-hidden />
          {t("home.mobileCta.upload", { defaultValue: "Upload PDF — start free" })}
        </PremiumButton>
      </div>
    </div>
  );
}

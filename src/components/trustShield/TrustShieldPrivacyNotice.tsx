"use client";

import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTrustShield } from "@/context/TrustShieldContext";

export function TrustShieldPrivacyNotice() {
  const { t } = useTranslation();
  const { privacyNoticeSeen, dismissPrivacyNotice } = useTrustShield();

  if (privacyNoticeSeen) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("trustShield.privacyNoticeTitle", { defaultValue: "Privacy-First is on by default" })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("trustShield.privacyNoticeBody", {
              defaultValue:
                "Your files stay in browser memory. We do not upload PDFs for processing unless you turn off Privacy-First mode below.",
            })}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={dismissPrivacyNotice}
        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {t("trustShield.privacyNoticeDismiss", { defaultValue: "Got it" })}
      </button>
    </div>
  );
}

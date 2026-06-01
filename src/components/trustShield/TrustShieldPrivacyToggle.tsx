"use client";

import { useTranslation } from "react-i18next";
import { useTrustShield } from "@/context/TrustShieldContext";

export function TrustShieldPrivacyToggle() {
  const { t } = useTranslation();
  const { privacyFirst, setPrivacyFirst } = useTrustShield();

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/80 px-4 py-3 text-sm">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        checked={privacyFirst}
        onChange={(e) => setPrivacyFirst(e.target.checked)}
      />
      <span>
        <span className="font-semibold text-foreground">
          {t("trustShield.privacyMode", { defaultValue: "Privacy-First (RAM only)" })}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {t("trustShield.privacyDesc", {
            defaultValue:
              "Files never leave your device. Cloud staging is disabled. Bulk merge up to 50 files in-browser.",
          })}
        </span>
      </span>
    </label>
  );
}

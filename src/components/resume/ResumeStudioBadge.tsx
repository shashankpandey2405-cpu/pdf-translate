import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ResumeStudioBadge() {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("resumeStudio.badge")}
    </div>
  );
}

"use client";

import { Download, FileText, Layout } from "lucide-react";
import { useTranslation } from "react-i18next";

export type MobilePane = "form" | "preview";

type Props = {
  pane: MobilePane;
  onPane: (p: MobilePane) => void;
  onDownload: () => void;
  exporting: boolean;
};

export function MobileResumeToolbar({ pane, onPane, onDownload, exporting }: Props) {
  const { t } = useTranslation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center gap-2 touch-manipulation">
      <button
        type="button"
        onClick={() => onPane("form")}
        className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold ${
          pane === "form" ? "bg-primary/10 text-primary" : "text-muted-foreground"
        }`}
      >
        <FileText className="h-5 w-5" />
        {t("resumeStudio.mobile.edit")}
      </button>
      <button
        type="button"
        onClick={() => onPane("preview")}
        className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold ${
          pane === "preview" ? "bg-primary/10 text-primary" : "text-muted-foreground"
        }`}
      >
        <Layout className="h-5 w-5" />
        {t("resumeStudio.mobile.preview")}
      </button>
      <button
        type="button"
        disabled={exporting}
        onClick={onDownload}
        className="flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold bg-primary text-white disabled:opacity-50"
      >
        <Download className="h-5 w-5" />
        {t("resumeStudio.download")}
      </button>
    </div>
  );
}

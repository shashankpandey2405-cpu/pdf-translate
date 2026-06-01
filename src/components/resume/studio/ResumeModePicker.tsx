"use client";

import { FileEdit, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  onManual: () => void;
  onAi: () => void;
};

export function ResumeModePicker({ onManual, onAi }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={onManual}
        className={cn(
          "flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <FileEdit className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            {t("resumeStudio.mode.manualTitle", { defaultValue: "Manual builder" })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("resumeStudio.mode.manualDesc", {
              defaultValue: "Fill sections yourself. Free, private, auto-saved in your browser.",
            })}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onAi}
        className={cn(
          "relative flex flex-col items-start gap-3 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-violet-500/10 p-6 text-left",
          "hover:border-primary hover:shadow-md transition-all",
        )}
      >
        <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          AI
        </span>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            {t("resumeStudio.mode.aiTitle", { defaultValue: "AI Resume Builder" })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("resumeStudio.mode.aiDesc", {
              defaultValue: "Describe your background — AI structures a professional ATS-friendly resume. Uses credits.",
            })}
          </p>
        </div>
      </button>
    </div>
  );
}

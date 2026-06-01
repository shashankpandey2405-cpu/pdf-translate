"use client";

import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brandLogoSrc } from "@/lib/branding";
import type { SignInTone } from "@/lib/conversion/signInCopy";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueGoogle: () => void;
  reason?: string;
  tone?: SignInTone;
  loading?: boolean;
};

const BENEFIT_KEYS = [
  "authWorkspace.benefitLimits",
  "authWorkspace.benefitResume",
  "authWorkspace.benefitHistory",
] as const;

const TITLE_BY_TONE: Record<SignInTone, string> = {
  default: "authWorkspace.title",
  result: "authWorkspace.titleResult",
  cloud: "authWorkspace.titleCloud",
  ai: "authWorkspace.titleAi",
};

const SUBTITLE_BY_TONE: Record<SignInTone, string> = {
  default: "authWorkspace.subtitle",
  result: "authWorkspace.subtitleResult",
  cloud: "authWorkspace.subtitleCloud",
  ai: "authWorkspace.subtitleAi",
};

const TONE_ACCENT: Record<SignInTone, string> = {
  default: "from-primary/15 via-primary/5 to-transparent",
  result: "from-emerald-500/15 via-primary/5 to-transparent",
  cloud: "from-indigo-500/20 via-violet-500/8 to-transparent",
  ai: "from-violet-500/20 via-fuchsia-500/8 to-transparent",
};

export function SignInWorkspaceModal({
  open,
  onOpenChange,
  onContinueGoogle,
  reason,
  tone = "default",
  loading,
}: Props) {
  const { t } = useTranslation();
  const titleKey = TITLE_BY_TONE[tone] ?? TITLE_BY_TONE.default;
  const fallbackSubtitleKey = SUBTITLE_BY_TONE[tone] ?? SUBTITLE_BY_TONE.default;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sign-in-workspace-modal",
          "gap-0 overflow-hidden border border-border/50 bg-card p-0 shadow-2xl",
          "w-[calc(100vw-2rem)] max-w-[400px] sm:max-w-[400px]",
          "rounded-2xl sm:rounded-2xl",
          "[&>button]:right-3 [&>button]:top-3 [&>button]:h-8 [&>button]:w-8 [&>button]:rounded-full [&>button]:bg-muted/80",
        )}
      >
        <div
          className={cn(
            "border-b border-border/40 bg-gradient-to-br px-5 pb-4 pt-5 sm:px-6 sm:pt-6",
            TONE_ACCENT[tone],
          )}
        >
          <DialogHeader className="space-y-2.5 text-center sm:text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-background/80 shadow-sm ring-1 ring-border/60">
              <img
                src={brandLogoSrc()}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <DialogTitle className="text-base font-bold tracking-tight sm:text-lg">
                {t(titleKey)}
              </DialogTitle>
            </div>
            <DialogDescription className="mx-auto max-w-[320px] text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              {reason ?? t(fallbackSubtitleKey)}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <ul className="space-y-2 text-[13px] text-foreground">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-2.5 w-2.5 text-emerald-600" aria-hidden />
                </span>
                <span className="leading-snug">{t(key)}</span>
              </li>
            ))}
            <li className="flex items-start gap-2 text-muted-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">
                <Check className="h-2.5 w-2.5" aria-hidden />
              </span>
              <span className="leading-snug">{t("authWorkspace.benefitTemplates")}</span>
            </li>
          </ul>

          <p className="mt-3.5 flex items-start gap-1.5 rounded-lg bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            {t("authWorkspace.privacy")}
          </p>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={onContinueGoogle}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {t("authWorkspace.continueGoogle")}
            </button>
            <p className="text-center text-[10px] text-muted-foreground">
              {t("authWorkspace.continueGoogleSub")}
            </p>
            <Link
              href="/login"
              onClick={() => onOpenChange(false)}
              className="block py-1 text-center text-xs font-medium text-primary hover:underline"
            >
              {t("authWorkspace.continueEmail")}
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

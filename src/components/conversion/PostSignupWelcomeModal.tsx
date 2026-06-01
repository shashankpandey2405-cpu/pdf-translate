"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Cloud, MessageSquare, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePremium } from "@/context/PremiumContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  hasShownWelcomeForUser,
  markWelcomeShownForUser,
} from "@/lib/conversion/guestEngagement";
import { logConversionEvent } from "@/utils/logger";

/**
 * One-time welcome after first Google sign-in — explains credits & next steps.
 */
export function PostSignupWelcomeModal() {
  const { t } = useTranslation();
  const { isSignedIn } = usePremium();
  const { user } = useAuthSession();
  const [open, setOpen] = useState(false);

  const welcomeKey = user?.email ?? user?.name ?? "anonymous";

  useEffect(() => {
    if (!isSignedIn || !welcomeKey || welcomeKey === "anonymous") return;
    if (hasShownWelcomeForUser(welcomeKey)) return;
    const tmr = window.setTimeout(() => {
      setOpen(true);
      logConversionEvent("post_signup_welcome_shown");
    }, 400);
    return () => window.clearTimeout(tmr);
  }, [isSignedIn, welcomeKey]);

  const close = useCallback(() => {
    if (welcomeKey && welcomeKey !== "anonymous") markWelcomeShownForUser(welcomeKey);
    setOpen(false);
    logConversionEvent("post_signup_welcome_dismissed");
  }, [welcomeKey]);

  const onTryAi = useCallback(() => {
    if (welcomeKey && welcomeKey !== "anonymous") markWelcomeShownForUser(welcomeKey);
    setOpen(false);
    logConversionEvent("post_signup_welcome_cta", { target: "chat-pdf" });
  }, [welcomeKey]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-md rounded-3xl border border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
            {t("conversion.welcome.title", { defaultValue: "You're in — welcome to PDFTrusted" })}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {t("conversion.welcome.body", {
              defaultValue:
                "Your free account includes 10 credits every month for Turbo Cloud and AI tools. Browser merge & compress stay unlimited without signup.",
            })}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
            {t("conversion.welcome.benefitCredits", {
              defaultValue: "10 credits/month — OCR, translate, summarize, chat",
            })}
          </li>
          <li className="flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {t("conversion.welcome.benefitCloud", {
              defaultValue: "Turbo Cloud for heavy PDFs — auto-deleted after delivery",
            })}
          </li>
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Link
            href="/chat-pdf"
            onClick={onTryAi}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            {t("conversion.welcome.ctaChat", { defaultValue: "Try Chat PDF" })}
          </Link>
          <Link
            href="/account"
            onClick={close}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {t("conversion.welcome.ctaAccount", { defaultValue: "View my credits" })}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

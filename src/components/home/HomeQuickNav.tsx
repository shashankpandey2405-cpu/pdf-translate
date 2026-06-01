"use client";

import { Link } from "wouter";
import { LayoutDashboard, Crown, LogIn, Grid3X3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/context/PremiumContext";
import { isAuthEnabled } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:bg-card press-scale touch-manipulation";

export function HomeQuickNav() {
  const { t } = useTranslation();
  const { isSignedIn } = usePremium();
  const authOn = isAuthEnabled();

  return (
    <nav
      aria-label="Quick navigation"
      className="border-b border-border/60 bg-gradient-to-b from-muted/30 to-transparent"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap gap-2 px-4 py-4 sm:px-6 sm:gap-3">
        <Link href="/all-tools" className={cn(linkClass, "min-w-[calc(50%-0.25rem)] sm:min-w-0 sm:flex-none")}>
          <Grid3X3 className="h-4 w-4 text-primary shrink-0" aria-hidden />
          {t("home.quickNav.tools", { defaultValue: "All tools" })}
        </Link>
        <Link href="/pricing" className={cn(linkClass, "min-w-[calc(50%-0.25rem)] sm:min-w-0 sm:flex-none")}>
          <Crown className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
          {t("home.quickNav.pricing", { defaultValue: "Pricing" })}
        </Link>
        {authOn && isSignedIn ? (
          <Link href="/account" className={cn(linkClass, "w-full sm:w-auto sm:flex-1")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
            {t("home.quickNav.dashboard", { defaultValue: "Dashboard" })}
          </Link>
        ) : authOn ? (
          <Link href="/login" className={cn(linkClass, "w-full sm:w-auto sm:flex-1")}>
            <LogIn className="h-4 w-4 shrink-0" aria-hidden />
            {t("home.quickNav.signIn", { defaultValue: "Sign in" })}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

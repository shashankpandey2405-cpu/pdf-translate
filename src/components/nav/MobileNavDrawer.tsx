"use client";

import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { Loader2, LogIn, LogOut, Menu, Smartphone, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { assertAuthApiReachable, signInWithGoogle, signOut } from "@/lib/authClient";
import { isAuthEnabled } from "@/lib/featureFlags";
import { LANGUAGES } from "../../../constants/tools";
import type { SupportedLanguage } from "@/i18n";
import { toast } from "sonner";
import { InstallModal } from "@/components/pwa/InstallModal";
import ThemeToggle from "@/components/ThemeToggle";
import { PremiumRemainingBadge } from "@/components/processing/PremiumRemainingBadge";

type Props = {
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentLanguage: string | undefined;
};

export function MobileNavDrawer({ onLanguageChange, currentLanguage }: Props) {
  const { t, i18n: i18nInstance } = useTranslation();
  const { user, isSignedIn, isLoading } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const postLoginPath = useMemo(
    () => `/${i18nInstance.language}/all-tools`,
    [i18nInstance.language],
  );

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleBusy(true);
    try {
      const probe = await assertAuthApiReachable();
      if (!probe.ok) {
        toast.error(t(probe.i18nKey), probe.detail ? { description: probe.detail } : undefined);
        return;
      }
      const result = await signInWithGoogle(postLoginPath);
      if (!result.ok) toast.error(result.error);
    } finally {
      setGoogleBusy(false);
    }
  }, [postLoginPath, t]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    const result = await signOut(`/${i18nInstance.language}`);
    if (!result.ok) toast.error(result.error);
  }, [i18nInstance.language]);

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Account";
  const initial = (displayName[0] ?? "U").toUpperCase();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label={t("mobileNav.openMenu", { defaultValue: "Open menu" })}
          >
            <Menu className="h-4 w-4" aria-hidden />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-[min(100vw-1rem,20rem)] flex-col gap-0 p-0 pb-[env(safe-area-inset-bottom)] sm:max-w-sm"
        >
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base font-semibold">PDFTrusted</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {/* Top: profile or sign in */}
            <section className="mb-6">
              {isAuthEnabled() && isLoading && (
                <Skeleton className="h-16 w-full rounded-2xl" />
              )}
              {isAuthEnabled() && !isLoading && isSignedIn && user && (
                <div className="mb-2 flex justify-end">
                  <PremiumRemainingBadge />
                </div>
              )}
              {isAuthEnabled() && !isLoading && isSignedIn && user && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                  <Avatar className="h-12 w-12 rounded-xl">
                    {user.image ? (
                      <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />
                    ) : null}
                    <AvatarFallback className="rounded-xl bg-primary/15 font-bold text-primary">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    {user.email && (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    )}
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <User className="h-3 w-3" aria-hidden />
                      {t("nav.myProfile", { defaultValue: "My Profile" })}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="shrink-0 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("nav.signOut", { defaultValue: "Sign out" })}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
              {isAuthEnabled() && !isLoading && !isSignedIn && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("mobileNav.signInSignUp", { defaultValue: "Sign in or create a free account" })}
                  </p>
                  <button
                    type="button"
                    disabled={googleBusy}
                    onClick={() => void handleGoogleSignIn()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {googleBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <LogIn className="h-4 w-4" aria-hidden />
                    )}
                    {t("nav.continueWithGoogle", { defaultValue: "Continue with Google" })}
                  </button>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-2xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    {t("nav.login", { defaultValue: "Login" })}
                  </Link>
                </div>
              )}
            </section>

            {/* Middle: language + tools link */}
            <section className="mb-6 space-y-3">
              <label htmlFor="mobile-language-select" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("nav.language", { defaultValue: "Language" })}
              </label>
              <select
                id="mobile-language-select"
                name="language"
                aria-label={t("nav.language", { defaultValue: "Select language" })}
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
              <Link
                href="/pdf-editor"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"
              >
                {t("nav.pdfEditor", { defaultValue: "PDF Editor" })}
              </Link>
              <Link
                href="/all-tools"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t("mobileNav.allTools", { defaultValue: "All tools" })}
              </Link>
            </section>
          </div>

          {/* Bottom: install + theme */}
          <section className="mt-auto border-t border-border px-5 py-4 space-y-3">
            <Link
              href="/get-app"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("getApp.title", { defaultValue: "Get the app" })}
            </Link>
            <Link
              href="/recent"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-2xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("history.recentActivity", { defaultValue: "Recent activity" })}
            </Link>
            <button
              type="button"
              onClick={() => {
                setInstallOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/15"
            >
              <Smartphone className="h-4 w-4" aria-hidden />
              {t("mobileNav.installApp", { defaultValue: "Install App" })}
            </button>
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </section>
        </SheetContent>
      </Sheet>

      <InstallModal open={installOpen} onOpenChange={setInstallOpen} />
    </>
  );
}

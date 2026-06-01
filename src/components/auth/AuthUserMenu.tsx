"use client";

import { useCallback, useMemo } from "react";
import { Link } from "wouter";
import { Loader2, LogOut, Sparkles, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthSession } from "@/hooks/useAuthSession";
import { signOut } from "@/lib/authClient";
import { authOnlyProductMode, isAuthEnabled, showAuthPremiumMarketingUi } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GuestNavSignInCta } from "@/components/conversion/GuestNavSignInCta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function AuthUserMenu({ className, onNavigate }: Props) {
  const { t, i18n } = useTranslation();
  const { user, isSignedIn, isLoading } = useAuthSession();

  const postLoginPath = useMemo(() => {
    if (typeof window === "undefined") return `/${i18n.language}/all-tools`;
    const tail = window.location.pathname.replace(/^\/[^/]+/, "") || "";
    return `${tail}${window.location.search}` || `/${i18n.language}/all-tools`;
  }, [i18n.language]);

  const handleSignOut = useCallback(async () => {
    onNavigate?.();
    const result = await signOut(`/${i18n.language}`);
    if (!result.ok) {
      toast.error(result.error);
    }
  }, [i18n.language, onNavigate]);

  if (!isAuthEnabled()) return null;

  if (isLoading) {
    return (
      <div className={cn("flex items-center", className)}>
        <Skeleton className="h-10 w-[140px] rounded-2xl sm:w-[180px]" aria-hidden />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <GuestNavSignInCta postLoginPath={postLoginPath} onNavigate={onNavigate} />
        <Link
          href="/login"
          onClick={onNavigate}
          className="hidden md:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {t("loginPage.moreOptions", { defaultValue: "More options" })}
        </Link>
      </div>
    );
  }

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Account";
  const initial = (displayName[0] ?? "U").toUpperCase();
  const showPremiumSlot = showAuthPremiumMarketingUi() && !authOnlyProductMode();

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("nav.myProfile", { defaultValue: "Account menu" })}
            className="inline-flex min-h-[40px] max-w-[220px] items-center gap-2 rounded-2xl border border-border bg-card pl-1.5 pr-2 py-1 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="h-8 w-8 rounded-xl">
              {user?.image ? (
                <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />
              ) : null}
              <AvatarFallback className="rounded-xl bg-primary/15 text-xs font-bold text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="truncate hidden sm:inline">{displayName}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate font-normal">{user.email}</p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/account"
              onClick={onNavigate}
              className="flex w-full items-center gap-2 cursor-pointer"
            >
              <User className="h-4 w-4" aria-hidden />
              {t("nav.myProfile", { defaultValue: "My Profile" })}
            </Link>
          </DropdownMenuItem>
          {showPremiumSlot && isSignedIn ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/account"
                  onClick={onNavigate}
                  className="flex w-full items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {t("nav.cloudUsage", { defaultValue: "Premium cloud usage" })}
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void handleSignOut()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("nav.signOut", { defaultValue: "Sign out" })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

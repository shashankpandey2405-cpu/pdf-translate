"use client";

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { Loader2, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthSession } from "@/hooks/useAuthSession";
import { signOut } from "@/lib/authClient";
import { isAuthEnabled, isEnhancedProcessingEnabled } from "@/lib/featureFlags";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { RecentActivityPanel } from "@/components/history/RecentActivityPanel";
import { CloudJobHistoryPanel } from "@/components/processing/CloudJobHistoryPanel";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { AccountPlanCard } from "@/components/account/AccountPlanCard";
import { AccountCreditCard } from "@/components/account/AccountCreditCard";
import { CreditHistoryPanel } from "@/components/account/CreditHistoryPanel";
import { PremiumDashboard } from "@/components/account/PremiumDashboard";

type BalanceData = {
  isPremium: boolean;
  premiumUntil?: string | null;
  credits: {
    balance: number;
    available: number;
    reserved: number;
    monthlyGrant: number;
  };
  aiTrial: { trialRemaining: number };
} | null;

export default function Account() {
  const { t, i18n } = useTranslation();
  const { user, isSignedIn, isLoading } = useAuthSession();
  const [, setLocation] = useLocation();
  const { usage } = useProcessingMode();
  const [balanceData, setBalanceData] = useState<BalanceData>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await fetch("/api/credits/balance", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBalanceData(data);
      }
    } catch { /* ignore */ }
    finally { setBalanceLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAuthEnabled()) {
      setLocation("/");
      return;
    }
    if (!isLoading && !isSignedIn) {
      setLocation("/login?intent=account");
    }
  }, [isLoading, isSignedIn, setLocation]);

  useEffect(() => {
    if (isSignedIn) void fetchBalance();
  }, [isSignedIn, fetchBalance]);

  if (!isAuthEnabled()) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (!isSignedIn || !user) return null;

  const displayName = user.name?.trim() || user.email?.split("@")[0] || "Account";
  const initial = (displayName[0] ?? "U").toUpperCase();

  async function handleSignOut() {
    const result = await signOut(`/${i18n.language}`);
    if (!result.ok) {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Helmet>
        <title>{t("account.title", { defaultValue: "My account" })} | PDFTrusted</title>
        <meta
          name="description"
          content={t("account.subtitle", {
            defaultValue: "Your PDFTrusted profile, plan, credits and usage history.",
          })}
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="mx-auto w-full max-w-screen-xl px-4 py-12 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-16">
        <PremiumDashboard
          displayName={displayName}
          isPremium={balanceData?.isPremium ?? false}
          premiumUntil={balanceData?.premiumUntil}
          creditsAvailable={balanceData?.credits?.available ?? 0}
          monthlyGrant={balanceData?.credits?.monthlyGrant ?? 0}
        />

        <h1 className="mt-10 text-2xl font-semibold tracking-tight text-foreground">
          {t("account.title", { defaultValue: "My account" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t("account.subtitle", {
            defaultValue: "Your PDFTrusted profile, plan, credits and usage history.",
          })}
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl">
              {user.image ? (
                <AvatarImage src={user.image} alt="" referrerPolicy="no-referrer" />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-primary/15 text-lg font-bold text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">{displayName}</p>
              {user.email && (
                <p className="text-sm text-slate-600 truncate">{user.email}</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label={t("nav.signOut", { defaultValue: "Sign out" })}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-300 ease-out hover:bg-red-200"
            >
              <LogOut className="h-4 w-4" />
              {t("nav.signOut", { defaultValue: "Sign out" })}
            </button>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-300 ease-out hover:bg-muted"
            >
              {t("nav.home", { defaultValue: "Home" })}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {balanceLoading && !balanceData ? (
            <div className="col-span-2 flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <AccountPlanCard
                isPremium={balanceData?.isPremium ?? false}
                premiumUntil={balanceData?.premiumUntil}
              />
              <AccountCreditCard
                balance={balanceData?.credits?.balance ?? 0}
                available={balanceData?.credits?.available ?? 0}
                reserved={balanceData?.credits?.reserved ?? 0}
                monthlyGrant={balanceData?.credits?.monthlyGrant ?? 0}
                aiTrialRemaining={balanceData?.aiTrial?.trialRemaining ?? 0}
              />
            </>
          )}
        </div>

        {isEnhancedProcessingEnabled() ? (
          <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cloud Processing
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-border bg-card/80 p-3">
                <p className="text-xs text-muted-foreground">Browser</p>
                <p className="mt-1 font-semibold text-foreground">Unlimited</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 p-3">
                <p className="text-xs text-muted-foreground">Cloud + AI credits</p>
                <p className="mt-1 font-semibold text-foreground">
                  {usage?.enabled && usage.credits
                    ? `${usage.credits.available ?? 0} of ${usage.credits.monthlyGrant ?? 10} this month`
                    : "Sign in to track"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Credit History</h2>
          <CreditHistoryPanel />
        </div>

        {isEnhancedProcessingEnabled() ? (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Cloud Job History</h2>
            <CloudJobHistoryPanel />
          </div>
        ) : null}

        <div className="mt-8">
          <RecentActivityPanel compact />
        </div>
      </div>
    </>
  );
}

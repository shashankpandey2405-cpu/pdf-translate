"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import type { CreditEstimateResponse } from "@/lib/enhanced/enhancedJobClient";
import { cn } from "@/lib/utils";
import { authOnlyProductMode } from "@/lib/featureFlags";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useBillingState } from "@/hooks/useBillingState";
import { requestUpgradeAfterLimit } from "@/lib/billing/upgradeFlow";

type Props = {
  estimate: CreditEstimateResponse | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
};

export function AiCreditEstimateCard({ estimate, loading, error, className }: Props) {
  const { isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const billing = useBillingState();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Calculating AI credits…
      </div>
    );
  }

  if (error) {
    return (
      <p
        className={cn(
          "rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive",
          className,
        )}
      >
        {error}
      </p>
    );
  }

  if (!estimate) return null;

  if (estimate.useTrial) {
    return (
      <div className={cn("rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs", className)}>
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Free AI trial — no credits used
        </p>
        <p className="mt-0.5 text-muted-foreground">
          1 lifetime trial per account · OpenRouter free models for small docs
        </p>
      </div>
    );
  }

  const handleCreditsCta = () => {
    if (authOnlyProductMode()) return;
    if (!estimate.canProceed) {
      if (billing.showExtraCreditsPurchase) {
        navigate("/pricing#credit-packs");
        return;
      }
      requestUpgradeAfterLimit({
        isSignedIn,
        requestSignIn,
        navigate,
        reason: billing.isPremium
          ? "Add credits from Pricing."
          : `Free accounts get ${estimate.credits?.monthlyGrant ?? 10} credits each month after sign-in.`,
      });
    }
  };

  if (!estimate.canProceed) {
    return (
      <div className={cn("rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs", className)}>
        <p className="font-semibold text-foreground">Not enough AI credits</p>
        {!authOnlyProductMode() ? (
          <button
            type="button"
            onClick={handleCreditsCta}
            className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
          >
            {billing.showExtraCreditsPurchase
              ? "Buy extra credits →"
              : billing.isPremium
                ? "View subscription credits →"
                : "Upgrade to Premium →"}
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}

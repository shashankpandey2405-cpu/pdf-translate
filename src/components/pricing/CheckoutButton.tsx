"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authOnlyProductMode } from "@/lib/featureFlags";
import { useBillingState } from "@/hooks/useBillingState";
import { useAuthAction } from "@/hooks/useAuthAction";
import { startCheckout } from "@/lib/payments/checkoutClient";
import type { CheckoutProductId } from "@/lib/pricing/checkoutProducts";
import { extraCreditsPurchaseBlockedMessage } from "@/lib/billing/extraCreditsPolicy";
import { isOnPricingPath } from "@/lib/billing/upgradeFlow";
import { toast } from "sonner";

type Props = {
  product: CheckoutProductId;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  signInReason?: string;
};

function isCreditProduct(product: CheckoutProductId): boolean {
  return product.startsWith("credits_");
}

function checkoutErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Could not start PayPal checkout. Check that PayPal is configured on the server.";
}

export function CheckoutButton({
  product,
  children,
  className,
  disabled,
  signInReason = "Sign in to purchase.",
}: Props) {
  const { resolveSignedIn, requireSignIn, requirePremiumUpgrade, requestUpgradeAfterLimit } =
    useAuthAction();
  const billing = useBillingState();
  const [loading, setLoading] = useState(false);

  if (authOnlyProductMode()) return null;

  const creditPack = isCreditProduct(product);

  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || loading) return;

    const signedIn = await resolveSignedIn();

    if (creditPack) {
      if (!signedIn) {
        await requirePremiumUpgrade(signInReason);
        return;
      }
      if (!billing.canPurchaseExtraCredits) {
        requestUpgradeAfterLimit(extraCreditsPurchaseBlockedMessage());
        return;
      }
      if (!billing.showExtraCreditsPurchase) {
        toast.info("You still have AI credits on your subscription. Extra packs appear when your balance is low.");
        return;
      }
    } else if (!signedIn) {
      await requireSignIn({
        reason: signInReason,
        deferredAction: undefined,
        returnPath: isOnPricingPath() ? undefined : "/pricing",
      });
      return;
    }

    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    setLoading(true);
    try {
      const url = await startCheckout(product);
      window.location.href = url;
    } catch (err) {
      const msg = checkoutErrorMessage(err);
      toast.error(msg, {
        duration: 8000,
        description:
          msg.includes("plan") || msg.includes("configured")
            ? "Add PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and subscription Plan IDs in Vercel, then redeploy."
            : undefined,
      });
      setLoading(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      }
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={(e) => void onClick(e)}
      className={cn(className, (disabled || loading) && "cursor-not-allowed opacity-60")}
    >
      {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

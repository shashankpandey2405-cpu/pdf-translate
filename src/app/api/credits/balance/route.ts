import { requireApiUser } from "@/server/enhanced/auth";
import { getCreditBalance } from "@/server/credits/ledger";
import { getAiTrialSnapshot } from "@/server/ai/usageLimits";
import { getAppEnv } from "@/server/types";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import {
  BILLING_CURRENCY,
  canPurchaseExtraCredits,
  shouldShowExtraCreditsPurchase,
} from "@/lib/billing/extraCreditsPolicy";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);
  const [credits, aiTrial] = await Promise.all([
    getCreditBalance(user.id, isPremium),
    getAiTrialSnapshot(user.id),
  ]);

  let premiumUntil: string | null = null;
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("profiles")
      .select("premium_until")
      .eq("id", user.id)
      .maybeSingle();
    premiumUntil = data?.premium_until ?? null;
  } catch { /* ignore */ }

  const available = credits.available ?? 0;

  return Response.json({
    isPremium,
    premiumUntil,
    credits,
    aiTrial,
    currency: BILLING_CURRENCY,
    canPurchaseExtraCredits: canPurchaseExtraCredits(isPremium),
    showExtraCreditsPurchase: shouldShowExtraCreditsPurchase(isPremium, available),
  });
}

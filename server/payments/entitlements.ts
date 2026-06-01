import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { grantPurchaseCredits } from "@/server/credits/ledger";
import type { ProductConfig } from "@/server/payments/catalog";

export async function recordPaymentEvent(opts: {
  provider: string;
  externalId: string;
  eventType: string;
  userId: string | null;
  payload: unknown;
}): Promise<"new" | "duplicate" | "skipped"> {
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("payment_events").insert({
      provider: opts.provider,
      external_id: opts.externalId,
      event_type: opts.eventType,
      user_id: opts.userId,
      payload: opts.payload as Record<string, unknown>,
    });
    if (error?.code === "23505") return "duplicate";
    if (error) {
      console.warn("[payment_events] insert failed", error.message);
      return "skipped";
    }
    return "new";
  } catch (err) {
    console.warn("[payment_events] unavailable", err);
    return "skipped";
  }
}

export async function applyCreditPackPurchase(
  userId: string,
  product: ProductConfig,
  meta: Record<string, unknown>,
): Promise<void> {
  const credits = product.credits ?? 0;
  if (credits <= 0) return;
  const result = await grantPurchaseCredits(userId, credits, meta);
  if (!result.ok) throw new Error(result.message);
}

function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(base: Date, years: number): Date {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export async function applyPremiumSubscription(
  userId: string,
  opts: {
    product: ProductConfig;
    renewsAt?: string | null;
    endsAt?: string | null;
    active: boolean;
    meta: Record<string, unknown>;
  },
): Promise<void> {
  const admin = createSupabaseAdmin();
  let premiumUntil: string | null = null;

  if (opts.active) {
    if (opts.renewsAt) {
      premiumUntil = new Date(opts.renewsAt).toISOString();
    } else if (opts.endsAt) {
      premiumUntil = new Date(opts.endsAt).toISOString();
    } else {
      const now = new Date();
      const until =
        opts.product.billingYears != null
          ? addYears(now, opts.product.billingYears)
          : addMonths(now, opts.product.billingMonths ?? 1);
      premiumUntil = until.toISOString();
    }
  } else if (opts.endsAt) {
    premiumUntil = new Date(opts.endsAt).toISOString();
  }

  const isPremium = opts.active && (!premiumUntil || new Date(premiumUntil).getTime() > Date.now());

  await admin.from("profiles").upsert(
    {
      id: userId,
      is_premium: isPremium,
      premium_until: premiumUntil,
    },
    { onConflict: "id" },
  );
}

export async function revokePremium(userId: string, endsAt?: string | null): Promise<void> {
  const admin = createSupabaseAdmin();
  const premiumUntil = endsAt ? new Date(endsAt).toISOString() : new Date().toISOString();
  const isPremium = new Date(premiumUntil).getTime() > Date.now();
  await admin.from("profiles").upsert(
    {
      id: userId,
      is_premium: isPremium,
      premium_until: premiumUntil,
    },
    { onConflict: "id" },
  );
}

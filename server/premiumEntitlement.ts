import { isProductAuthOnly } from "@/server/productAuthOnly";
import type { AppEnv } from "@/server/types";
import { getSupabaseUserFromRequest } from "@/server/supabaseAuth";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

/**
 * Server-side premium check from Supabase profiles ONLY.
 * Never trust client cookies, never shortcut via unlimited-user lists.
 * Premium = profiles.is_premium AND (premium_until > now OR no expiry set).
 */
export async function resolveIsPremium(req: Request, env: AppEnv): Promise<boolean> {
  if (isProductAuthOnly(env)) return false;

  const serviceKey = getServiceRoleKey();
  if (!serviceKey || !isSupabaseConfigured()) return false;

  const user = await getSupabaseUserFromRequest(req);
  if (!user?.id) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return false;

  try {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await admin
      .from("profiles")
      .select("is_premium, premium_until")
      .eq("id", user.id)
      .maybeSingle();

    if (!data?.is_premium) return false;
    if (data.premium_until) {
      return new Date(data.premium_until).getTime() > Date.now();
    }
    return true;
  } catch {
    return false;
  }
}

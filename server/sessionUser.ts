import type { AppEnv } from "./types";
import { hasPremiumCookie } from "./uploadPolicy";
import { isProductAuthOnly } from "./productAuthOnly";
import { getSupabaseUserFromRequest } from "./supabaseAuth";

export type AuthSessionUser = {
  id: string;
  email: string;
  name?: string;
  isPremium: boolean;
};

export async function getSessionUser(req: Request, env: AppEnv): Promise<AuthSessionUser | null> {
  const cookieHeader = req.headers.get("cookie") ?? undefined;
  const isPremium = isProductAuthOnly(env) ? false : hasPremiumCookie(cookieHeader);

  const supabaseUser = await getSupabaseUserFromRequest(req);
  if (supabaseUser?.email && supabaseUser.id) {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      isPremium,
    };
  }

  return null;
}

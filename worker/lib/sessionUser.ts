import type { Env } from "../env";
import { getAuthSessionJson } from "./auth";
import { hasPremiumCookie } from "./uploadPolicy";
import { isProductAuthOnly } from "./productAuthOnly";

type SessionUserShape = {
  email?: unknown;
  name?: unknown;
};

export type AuthSessionUser = {
  email: string;
  name?: string;
  isPremium: boolean;
};

export async function getSessionUser(req: Request, env: Env): Promise<AuthSessionUser | null> {
  const session = await getAuthSessionJson(req, env);
  const maybeUser = (session.user ?? null) as SessionUserShape | null;
  const email = typeof maybeUser?.email === "string" ? maybeUser.email.trim().toLowerCase() : "";
  if (!email) return null;
  const name =
    typeof maybeUser?.name === "string" && maybeUser.name.trim() ? maybeUser.name.trim() : undefined;
  return {
    email,
    name,
    isPremium: isProductAuthOnly(env) ? false : hasPremiumCookie(req.headers.get("cookie") ?? undefined),
  };
}

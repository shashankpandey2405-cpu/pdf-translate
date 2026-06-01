import type { User } from "@supabase/supabase-js";
import type { SessionUser } from "@/lib/authSession";

/** Map Supabase user → UI session shape. */
export function supabaseUserToSessionUser(user: User | null | undefined): SessionUser {
  if (!user) return null;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    null;
  const image =
    (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta?.picture === "string" && meta.picture) ||
    null;
  const email = user.email ?? null;

  if (!email && !name && !image) {
    return { email: null, name: "PDFTrusted account", image: null };
  }
  return { email, name, image };
}

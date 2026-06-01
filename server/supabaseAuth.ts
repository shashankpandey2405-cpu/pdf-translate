import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header.trim()) return [];
  return header.split(";").map((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return { name: part.trim(), value: "" };
    return {
      name: part.slice(0, idx).trim(),
      value: part.slice(idx + 1).trim(),
    };
  });
}

export type RequestAuthUser = {
  email: string;
  id?: string;
  source: "supabase";
};

export async function getSupabaseUserFromRequest(req: Request): Promise<RequestAuthUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.get("cookie") ?? "");
      },
      setAll() {
        /* read-only in upload/delete API routes */
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;
  return {
    email: user.email.trim().toLowerCase(),
    id: user.id,
    source: "supabase",
  };
}

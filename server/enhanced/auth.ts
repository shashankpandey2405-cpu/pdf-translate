import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function requireApiUser(): Promise<{ id: string; email?: string } | Response> {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "auth_unavailable", message: "Sign-in is not configured." }, { status: 503 });
  }
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ error: "auth_unavailable", message: "Sign-in is not configured." }, { status: 503 });
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return Response.json(
        { error: "unauthorized", message: "Sign in to use Enhanced Cloud Processing." },
        { status: 401 },
      );
    }
    return { id: data.user.id, email: data.user.email ?? undefined };
  } catch {
    return Response.json({ error: "auth_error", message: "Could not verify session." }, { status: 401 });
  }
}

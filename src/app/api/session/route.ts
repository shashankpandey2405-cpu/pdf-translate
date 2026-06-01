import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { supabaseUserToSessionUser } from "@/lib/supabase/user";
import { getAppEnv } from "@/server/types";
import { resolveIsPremium } from "@/server/premiumEntitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
};

export async function GET(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return Response.json({ user: undefined, isPremium: false }, { headers: NO_STORE });
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ user: undefined, isPremium: false }, { headers: NO_STORE });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const env = getAppEnv();
    const isPremium = await resolveIsPremium(req, env);

    return Response.json(
      {
        user: supabaseUserToSessionUser(user),
        isPremium,
      },
      { headers: NO_STORE },
    );
  } catch {
    return Response.json({ user: undefined, isPremium: false }, { headers: NO_STORE });
  }
}

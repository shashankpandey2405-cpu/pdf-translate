import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeNextPath } from "@/lib/auth/nextPath";
import { recordLoginEvent } from "@/server/auth/loginEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LOCALE = "en";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/login`, request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = normalizeNextPath(searchParams.get("next") ?? `/${DEFAULT_LOCALE}/all-tools`);

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/login?error=auth_callback`, origin));
    }
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user?.id) {
      await recordLoginEvent(data.user.id, request, "google");
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/login?error=auth_callback`, origin));
}

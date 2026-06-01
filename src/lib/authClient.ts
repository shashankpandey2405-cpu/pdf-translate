import { notifySessionChanged } from "@/lib/authSession";
import { buildOAuthRedirectTo, DEFAULT_POST_LOGIN_PATH } from "@/lib/auth/nextPath";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Probes Supabase auth availability. */
export async function assertAuthApiReachable(): Promise<
  { ok: true; i18nKey?: string; detail?: string } | { ok: false; i18nKey: string; detail?: string }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      i18nKey: "loginPage.errors.apiUnreachable",
      detail: "Supabase env missing",
    };
  }
  try {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, i18nKey: "loginPage.errors.apiUnreachable" };
    }
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        ok: false,
        i18nKey: "loginPage.errors.apiBadResponse",
        detail: error.message,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, i18nKey: "loginPage.errors.apiUnreachable" };
  }
}

/** Google OAuth via Supabase (redirect flow). */
export async function signInWithGoogle(
  nextPath = DEFAULT_POST_LOGIN_PATH,
): Promise<{ ok: true; error?: string } | { ok: false; error: string }> {
  if (typeof window === "undefined") return { ok: false, error: "Not in browser." };
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const origin = window.location.origin;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildOAuthRedirectTo(origin, nextPath),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Signs out via Supabase and redirects. */
export async function signOut(
  callbackUrl = "/",
): Promise<{ ok: true; error?: string } | { ok: false; error: string }> {
  if (typeof window === "undefined") return { ok: false, error: "Not in browser." };
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { ok: false, error: error.message };
  }

  try {
    const { clearPremiumFlow } = await import("@/lib/auth/premiumFlowRestore");
    await clearPremiumFlow();
  } catch {
    /* ignore */
  }

  notifySessionChanged();
  window.location.assign(callbackUrl);
  return { ok: true };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string,
): Promise<
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string; i18nKey?: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name, full_name: name } : undefined,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const needsEmailConfirmation = Boolean(data.user && !data.session);
  if (data.session) {
    notifySessionChanged();
  }
  return { ok: true, needsEmailConfirmation };
}

export async function signInWithCredentials(
  email: string,
  password: string,
  callbackUrl: string,
): Promise<{ ok: true; error?: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }

  notifySessionChanged();
  window.location.assign(callbackUrl);
  return { ok: true };
}

export async function requestPasswordReset(email: string): Promise<{ ok: true; error?: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/en/reset-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

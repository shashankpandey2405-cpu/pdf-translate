import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { supabaseUserToSessionUser } from "@/lib/supabase/user";

export type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export type SessionPayload = {
  user: SessionUser;
  isPremium: boolean;
};

export const SESSION_CHANGED_EVENT = "pdftrusted:session-changed";

export function notifySessionChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

function normalizeUser(raw: unknown): SessionUser {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const email = typeof u.email === "string" ? u.email : null;
  const name = typeof u.name === "string" ? u.name : u.name === null ? null : undefined;
  const image = typeof u.image === "string" ? u.image : u.image === null ? null : undefined;
  if (!email && !name && !image) {
    return { email: null, name: "PDFTrusted account", image: image ?? null };
  }
  return { email, name: name ?? null, image: image ?? null };
}

/** Client: read session from Supabase, then fall back to /api/session bridge. */
export async function fetchSessionClient(): Promise<SessionPayload> {
  if (typeof window !== "undefined" && isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        /* fall through to API */
      } else {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.user) {
        const bridge = await fetch(`/api/session?_=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        let isPremium = false;
        if (bridge.ok) {
          try {
            const payload = (await bridge.json()) as { isPremium?: boolean };
            isPremium = Boolean(payload.isPremium);
          } catch {
            /* ignore */
          }
        }
        return {
          user: supabaseUserToSessionUser(data.session.user),
          isPremium,
        };
      }
      }
    } catch {
      /* fall through to API */
    }
  }

  const url = `/api/session?_=${Date.now()}`;
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return { user: null, isPremium: false };
  }

  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return { user: null, isPremium: false };
  }

  try {
    const data = (await response.json()) as {
      user?: unknown;
      isPremium?: boolean;
    };
    return {
      user: normalizeUser(data.user),
      isPremium: Boolean(data.isPremium),
    };
  } catch {
    return { user: null, isPremium: false };
  }
}

/** @deprecated Use fetchSessionClient — kept for imports. */
export const fetchSession = fetchSessionClient;

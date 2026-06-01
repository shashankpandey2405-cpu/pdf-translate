import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Returns a browser client or null when public Supabase env is missing (never throws). */
export function createSupabaseBrowserClient(): ReturnType<typeof createBrowserClient> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

/** Singleton for client components (avoids recreating on every render). */
export function getSupabaseBrowserClient(): ReturnType<typeof createBrowserClient> | null {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}

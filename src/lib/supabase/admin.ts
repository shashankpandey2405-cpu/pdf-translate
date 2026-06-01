import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export function getSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    ""
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && getSupabaseServiceRoleKey().length > 0;
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminOrNull(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/** @throws when service role env is missing — prefer getSupabaseAdminOrNull in API routes. */
export function createSupabaseAdmin(): SupabaseClient {
  const admin = getSupabaseAdminOrNull();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }
  return admin;
}

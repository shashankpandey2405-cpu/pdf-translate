/** Supabase public env (also mapped to VITE_* in next.config for client bundles). */
export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    ""
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

/** Must be http(s); rejects placeholders and mistaken key values in the URL slot. */
export function isValidSupabaseUrl(url: string): boolean {
  if (!url || url.startsWith("sb_")) return false;
  if (/YOUR_PROJECT|YOUR_ANON|placeholder/i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!isValidSupabaseUrl(url) || !key) return false;
  if (/YOUR_SUPABASE|YOUR_ANON|placeholder/i.test(key)) return false;
  return true;
}

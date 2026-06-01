import { requireApiUser } from "@/server/enhanced/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("credit_transactions")
      .select("id, type, amount, balance_after, meta, created_at, job_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return Response.json({ transactions: [], total: 0 });
    }

    const { count } = await admin
      .from("credit_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    return Response.json({
      transactions: (data ?? []).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balance_after,
        toolSlug: (t.meta as Record<string, unknown>)?.toolSlug ?? (t.meta as Record<string, unknown>)?.tool ?? null,
        note: (t.meta as Record<string, unknown>)?.note ?? null,
        tier: (t.meta as Record<string, unknown>)?.tier ?? null,
        jobId: t.job_id,
        createdAt: t.created_at,
      })),
      total: count ?? 0,
    });
  } catch {
    return Response.json({ transactions: [], total: 0 });
  }
}

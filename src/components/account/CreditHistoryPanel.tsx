"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number | null;
  toolSlug: string | null;
  note: string | null;
  tier: string | null;
  jobId: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  grant: "Monthly Grant",
  purchase: "Credit Purchase",
  reserve: "Reserved",
  settle: "Used",
  refund: "Refund",
  release: "Released",
  expire: "Expired",
};

const TYPE_COLORS: Record<string, string> = {
  grant: "text-green-600",
  purchase: "text-green-600",
  reserve: "text-amber-700",
  settle: "text-red-600",
  refund: "text-green-600",
  release: "text-blue-600",
  expire: "text-muted-foreground",
};

function toolLabel(slug: string | null): string {
  if (!slug) return "—";
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CreditHistoryPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 20;

  const fetchHistory = async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/credits/history?limit=${pageSize}&offset=${offset}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setTransactions((prev) => (append ? [...prev, ...data.transactions] : data.transactions));
      setTotal(data.total ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchHistory(0, false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No credit history yet. Use an AI tool to see transactions here.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Tool</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <p className="font-medium text-foreground">{formatDate(tx.createdAt)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatTime(tx.createdAt)}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[tx.type] ?? "text-foreground"}`}
                  >
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </span>
                  {tx.note && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground truncate max-w-[140px]">
                      {tx.note}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-foreground">
                  {toolLabel(tx.toolSlug)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm">
                  <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-muted-foreground">
                  {tx.balanceAfter ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {transactions.length < total && (
        <div className="flex justify-center border-t border-border py-3">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => void fetchHistory(transactions.length, true)}
            className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Load more ({total - transactions.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

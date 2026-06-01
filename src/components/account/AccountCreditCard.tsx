"use client";

import { Coins, TrendingDown, Lock } from "lucide-react";

type Props = {
  balance: number;
  available: number;
  reserved: number;
  monthlyGrant: number;
  aiTrialRemaining?: number;
};

export function AccountCreditCard({
  balance,
  available,
  reserved,
  monthlyGrant,
  aiTrialRemaining = 0,
}: Props) {
  const pct = monthlyGrant > 0 ? Math.min(100, Math.round((available / monthlyGrant) * 100)) : 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        AI Credits
      </p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-extrabold text-foreground">{available}</span>
        <span className="mb-1 text-sm text-slate-600">available</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-border bg-background p-2">
          <Coins className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
          <p className="mt-1 font-semibold text-foreground">{balance}</p>
          <p className="text-slate-600">Total</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-2">
          <Lock className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
          <p className="mt-1 font-semibold text-foreground">{reserved}</p>
          <p className="text-muted-foreground">Reserved</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-2">
          <TrendingDown className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
          <p className="mt-1 font-semibold text-foreground">{monthlyGrant}/mo</p>
          <p className="text-slate-600">Grant</p>
        </div>
      </div>

      {aiTrialRemaining > 0 && (
        <p className="mt-3 rounded-xl bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary">
          {aiTrialRemaining} free AI trial remaining
        </p>
      )}
    </div>
  );
}

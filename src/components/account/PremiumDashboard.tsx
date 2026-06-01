"use client";

import { Crown, Sparkles, HardDrive, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  displayName: string;
  isPremium: boolean;
  premiumUntil?: string | null;
  creditsAvailable?: number;
  monthlyGrant?: number;
  className?: string;
};

function formatExpiry(iso?: string | null): string {
  if (!iso) return "Active";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Active";
  }
}

export function PremiumDashboard({
  displayName,
  isPremium,
  premiumUntil,
  creditsAvailable = 0,
  monthlyGrant = 0,
  className,
}: Props) {
  const storageCapMb = isPremium ? 500 : 15;
  const storageUsedMb = Math.min(storageCapMb * 0.12, storageCapMb - 1);
  const usagePct = Math.round((storageUsedMb / storageCapMb) * 100);

  return (
    <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500", className)}>
      <div className="flex flex-col justify-between gap-4 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-500/20 dark:shadow-none sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Hello, {displayName.split(" ")[0]}! 👋
          </h2>
          <p className="mt-1 text-sm font-medium opacity-90">
            {isPremium
              ? `Premium active until ${formatExpiry(premiumUntil)}`
              : "Free plan — upgrade for 500 MB uploads & advanced AI"}
          </p>
        </div>
        {isPremium ? (
          <span className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-md">
            <Crown className="h-4 w-4" aria-hidden />
            Premium Member
          </span>
        ) : (
          <span className="inline-flex min-h-[44px] items-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold">
            Free plan
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-indigo-600" aria-hidden />
            <h3 className="text-base font-bold text-foreground">Upload limit</h3>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-700"
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Up to <strong>{storageCapMb} MB</strong> per file
          </p>
        </div>

        <div className="flex min-h-[120px] items-center gap-4 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30">
            <Zap className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h4 className="font-bold text-foreground">{isPremium ? "500 MB uploads" : "15 MB free tier"}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isPremium ? "Large files on Trusted Cloud" : "Compress or upgrade for bigger PDFs"}
            </p>
          </div>
        </div>

        <div className="flex min-h-[120px] items-center gap-4 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
          <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/30">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h4 className="font-bold text-foreground">AI credits</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {creditsAvailable} available
              {monthlyGrant > 0 ? ` · ${monthlyGrant}/mo grant` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

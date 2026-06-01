"use client";

import { cn } from "@/lib/utils";

export type ComparisonRow = {
  feature: string;
  colA: string;
  colB: string;
};

type Props = {
  rows: ComparisonRow[];
  colAHeader: string;
  colBHeader: string;
  className?: string;
};

/** Mobile: stacked cards. Desktop: scrollable table if needed. */
export function ResponsiveComparisonTable({ rows, colAHeader, colBHeader, className }: Props) {
  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.feature} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm font-bold text-foreground">{row.feature}</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-primary">{colAHeader}</dt>
                <dd className="mt-0.5 leading-relaxed text-foreground">{row.colA}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{colBHeader}</dt>
                <dd className="mt-0.5 leading-relaxed text-muted-foreground">{row.colB}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="table-scroll hidden rounded-2xl border border-border md:block">
        <table className="w-full min-w-0 text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 font-semibold text-foreground">Feature</th>
              <th className="px-4 py-3 font-semibold text-primary">{colAHeader}</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">{colBHeader}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{row.feature}</td>
                <td className="px-4 py-3 text-foreground">{row.colA}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.colB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

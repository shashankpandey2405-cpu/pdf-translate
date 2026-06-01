"use client";

import { useEffect, useState } from "react";
import ToolSEO from "@/components/ToolSEO";
import { useTranslation } from "react-i18next";
import { isClientQaModeActive } from "@/lib/qa/isQaMode";
import { InternalRouteGuard } from "@/components/internal/InternalRouteGuard";

type HealthPayload = {
  ok: boolean;
  checks: Record<string, boolean>;
  queueDepth: Record<string, number>;
  bucket: string | null;
};

type RecentPayload = {
  failed: Array<{
    id: string;
    tool_slug: string;
    status: string;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
  }>;
  stuck: Array<{
    id: string;
    tool_slug: string;
    status: string;
    created_at: string;
  }>;
};

export default function EnhancedOps() {
  const { i18n } = useTranslation();
  const [data, setData] = useState<HealthPayload | null>(null);
  const [recent, setRecent] = useState<RecentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qaMode = isClientQaModeActive();

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/enhanced/health", { cache: "no-store" });
        const json = (await res.json()) as HealthPayload;
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load health");
      }
    })();

    if (qaMode) {
      void (async () => {
        try {
          const res = await fetch("/api/enhanced/jobs/recent", { cache: "no-store" });
          if (res.ok) {
            setRecent((await res.json()) as RecentPayload);
          }
        } catch {
          /* optional */
        }
      })();
    }
  }, [qaMode]);

  return (
    <InternalRouteGuard>
    <div className="max-w-2xl mx-auto px-4 py-12">
      <ToolSEO
        title="Enhanced ops"
        description="Internal enhanced pipeline health"
        slug="internal/enhanced-ops"
        lang={i18n.language}
        noIndex
      />
      <h1 className="text-2xl font-bold">Enhanced pipeline health</h1>
      <p className="mt-2 text-sm text-muted-foreground">Read-only status from /api/enhanced/health</p>

      {qaMode ? (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          QA mode active — daily caps and throttles bypassed in this environment only.
        </p>
      ) : null}

      {error ? <p className="mt-4 text-destructive text-sm">{error}</p> : null}

      {data?.queueDepth ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-semibold">Queue</th>
                <th className="px-3 py-2 text-right font-semibold">Depth</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.queueDepth).map(([pool, depth]) => (
                <tr key={pool} className="border-b border-border/50">
                  <td className="px-3 py-2">{pool}</td>
                  <td className="px-3 py-2 text-right">{depth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {recent && (recent.failed.length > 0 || recent.stuck.length > 0) ? (
        <div className="mt-6 space-y-4">
          {recent.failed.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-destructive">Recent failed jobs</h2>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {recent.failed.map((j) => (
                  <li key={j.id}>
                    {j.tool_slug} — {j.error_code ?? j.error_message ?? "failed"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {recent.stuck.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Stuck jobs (&gt;15m)</h2>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {recent.stuck.map((j) => (
                  <li key={j.id}>
                    {j.tool_slug} — {j.status} since {j.created_at}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {data ? (
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-border bg-muted/30 p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      )}
    </div>
    </InternalRouteGuard>
  );
}

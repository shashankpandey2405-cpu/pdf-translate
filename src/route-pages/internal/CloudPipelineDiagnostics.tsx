"use client";

import { useCallback, useState } from "react";
import { Link } from "wouter";
import { isEnhancedProcessingEnabled } from "@/lib/featureFlags";
import { Helmet } from "react-helmet-async";
import { InternalRouteGuard } from "@/components/internal/InternalRouteGuard";

type Row = { label: string; ok: boolean; detail: string };

export default function CloudPipelineDiagnostics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    const next: Row[] = [];
    const push = (label: string, ok: boolean, detail: string) => next.push({ label, ok, detail });

    push(
      "Client enhanced flag",
      isEnhancedProcessingEnabled(),
      `NEXT_PUBLIC_ENHANCED_ENABLED / VITE_ENHANCED_ENABLED`,
    );

    try {
      const res = await fetch("/api/enhanced/health", { credentials: "include" });
      const body = await res.json();
      push("Vercel /api/enhanced/health", res.ok && body.ok, JSON.stringify(body.checks ?? body));
      if (body.queueDepth) {
        push("Queue depth", true, JSON.stringify(body.queueDepth));
      }
    } catch (e) {
      push("Vercel /api/enhanced/health", false, e instanceof Error ? e.message : "failed");
    }

    try {
      const res = await fetch("/api/enhanced/usage", { credentials: "include" });
      const body = await res.json();
      push("Usage API", res.ok, JSON.stringify(body));
    } catch (e) {
      push("Usage API", false, e instanceof Error ? e.message : "failed");
    }

    try {
      const res = await fetch("https://cdn.jsdelivr.net/npm/tesseract.js/package.json");
      push("CSP: cdn.jsdelivr (Tesseract)", res.ok, `status ${res.status}`);
    } catch (e) {
      push(
        "CSP: cdn.jsdelivr (Tesseract)",
        false,
        e instanceof Error ? e.message : "blocked — update Content-Security-Policy connect-src/script-src",
      );
    }

    setRows(next);
    setLoading(false);
  }, []);

  return (
    <InternalRouteGuard>
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Cloud pipeline diagnostics (internal)</title>
      </Helmet>
      <h1 className="text-2xl font-bold">Cloud pipeline diagnostics</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Internal QA — checks hybrid infra from this browser session. Sign in to test usage.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Tool smoke runs (use locale in the address bar, e.g.{" "}
        <code className="rounded bg-muted px-1 py-0.5">/en/internal/cloud-smoke</code>):{" "}
        <Link className="underline hover:text-foreground" href="/internal/cloud-smoke">
          Open cloud smoke test
        </Link>
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="mt-6 min-h-[48px] rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
      >
        {loading ? "Running…" : "Run checks"}
      </button>
      <ul className="mt-8 space-y-3">
        {rows.map((r) => (
          <li
            key={r.label}
            className={`rounded-xl border p-4 text-sm ${r.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}
          >
            <p className="font-semibold">{r.label}</p>
            <p className="mt-1 break-all text-muted-foreground">{r.detail}</p>
          </li>
        ))}
      </ul>
    </div>
    </InternalRouteGuard>
  );
}

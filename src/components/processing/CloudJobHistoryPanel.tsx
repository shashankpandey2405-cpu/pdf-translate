"use client";

import { useEffect, useState } from "react";
import { Loader2, Cloud } from "lucide-react";

type CloudJobRow = {
  id: string;
  tool_slug: string;
  status: string;
  created_at: string;
  finished_at: string | null;
  file_size_bytes: number;
  pages: number | null;
  error_message: string | null;
};

export function CloudJobHistoryPanel() {
  const [jobs, setJobs] = useState<CloudJobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/enhanced/jobs/mine", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { jobs?: CloudJobRow[] };
        if (!cancelled) setJobs(data.jobs ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading cloud history…
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No Premium cloud jobs yet. Run Compress, PDF to Word, or OCR in Premium mode to see history here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
      {jobs.map((job) => (
        <li key={job.id} className="flex items-start gap-3 bg-card px-4 py-3 text-sm">
          <Cloud className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{job.tool_slug}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {job.status}
              {job.pages != null ? ` · ${job.pages} pages` : ""}
              {" · "}
              {new Date(job.created_at).toLocaleString()}
            </p>
            {job.error_message ? (
              <p className="text-xs text-destructive mt-1 line-clamp-2">{job.error_message}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

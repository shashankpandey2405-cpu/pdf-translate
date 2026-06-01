"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";

type Props = {
  file: File | null;
  /** When user navigates matches */
  onHighlightPage?: (pageIndex1Based: number) => void;
};

/** Lightweight in-editor text search (PDF.js extract); highlights via page navigation only for now. */
export function PdfSearchPanel({ file, onHighlightPage }: Props) {
  const [query, setQuery] = useState("");
  const [pagesText, setPagesText] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPagesText([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const pdf = await acquirePdfDocument(file);
        try {
          const texts: string[] = [];
          for (let i = 1; i <= pdf.numPages; i += 1) {
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            const line = tc.items
              .filter((item) => item && typeof (item as { str?: string }).str === "string")
              .map((item) => (item as { str: string }).str)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            texts.push(line);
          }
          if (!cancelled) setPagesText(texts);
        } finally {
          releasePdfDocument(file);
        }
      } catch {
        if (!cancelled) setPagesText([]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle.length) return [] as { page: number; snippet: string }[];
    const out: { page: number; snippet: string }[] = [];
    pagesText.forEach((text, idx) => {
      const lower = text.toLowerCase();
      let pos = 0;
      while (pos < lower.length) {
        const hit = lower.indexOf(needle, pos);
        if (hit < 0) break;
        const start = Math.max(0, hit - 24);
        const end = Math.min(text.length, hit + needle.length + 48);
        out.push({ page: idx + 1, snippet: text.slice(start, end) });
        pos = hit + needle.length;
      }
    });
    return out.slice(0, 40);
  }, [pagesText, query]);

  if (!file) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Search className="h-3.5 w-3.5" /> Search in PDF
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={busy ? "Loading text…" : "Type to search…"}
        disabled={busy}
        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
      />
      <ul className="max-h-36 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
        {matches.length === 0 && query.trim().length > 0 && !busy ? (
          <li>No matches.</li>
        ) : null}
        {matches.map((m, i) => (
          <li key={`${m.page}-${i}`}>
            <button
              type="button"
              className="w-full rounded-md px-1 py-0.5 text-left hover:bg-muted"
              onClick={() => onHighlightPage?.(m.page)}
            >
              <span className="font-semibold text-primary">p.{m.page}</span> {m.snippet}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

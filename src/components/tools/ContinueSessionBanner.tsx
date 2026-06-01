"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { Link } from "wouter";

const SESSION_KEY = "pdftrusted-last-tool";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

type SessionRecord = {
  slug: string;
  label: string;
  timestamp: number;
};

/**
 * Saves the current tool session so ContinueSessionBanner can prompt users to resume.
 */
export function saveToolSession(slug: string, label: string) {
  try {
    const record: SessionRecord = { slug, label, timestamp: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(record));
  } catch {}
}

/**
 * Shows a dismissible banner when the user previously used a different tool in this session.
 */
export function ContinueSessionBanner({ currentSlug }: { currentSlug: string }) {
  const [record, setRecord] = useState<SessionRecord | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed: SessionRecord = JSON.parse(raw);
      if (
        parsed.slug &&
        parsed.slug !== currentSlug &&
        Date.now() - parsed.timestamp < MAX_AGE_MS
      ) {
        setRecord(parsed);
      }
    } catch {}
  }, [currentSlug]);

  if (!record || dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
      <Clock className="h-4 w-4 shrink-0 text-primary" />
      <p className="min-w-0 text-xs text-foreground">
        Continue where you left off &mdash;{" "}
        <Link
          href={`/${record.slug}`}
          className="font-semibold text-primary hover:underline"
        >
          {record.label}
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-auto shrink-0 rounded-lg p-1 text-muted-foreground/60 hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

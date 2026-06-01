"use client";

import { useEffect, useState } from "react";
import { Link2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { subscribeShareNudge } from "@/lib/share/shareNudge";

const DISMISS_KEY = "pdftrusted-share-nudge-dismiss";

type Props = {
  className?: string;
};

/** Optional post-download share nudge (Phase 8) — dismissible. */
export function ShareAfterDownloadNudge({ className }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeShareNudge(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* noop */
    }
    setVisible(true);
  }), []);

  if (!visible) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://www.pdftrusted.com");
      toast.success("Link copied — share PDFTrusted with a friend!");
      sessionStorage.setItem(DISMISS_KEY, "1");
      setVisible(false);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-[55] mx-auto flex max-w-md items-center gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md lg:bottom-6",
        className,
      )}
    >
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">
        Know someone who works with PDFs? Share PDFTrusted — free browser tools, no signup needed.
      </p>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        <Link2 className="h-3.5 w-3.5" />
        Copy link
      </button>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

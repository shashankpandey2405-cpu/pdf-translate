"use client";

import { Link } from "wouter";
import { DESKTOP_NAV_CATEGORIES } from "@/lib/desktop/navCatalog";
import { Home } from "lucide-react";
import { PostResultSignupNudge } from "@/components/conversion/PostResultSignupNudge";
import { MobileDoneActions } from "@/components/mobile/MobileDoneActions";

type Props = {
  currentSlug: string;
  onProcessAnother?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  downloadLabel?: string;
};

export function MobilePostProcessPanel({
  currentSlug,
  onProcessAnother,
  onDownload,
  onShare,
  downloadLabel,
}: Props) {
  const suggested = DESKTOP_NAV_CATEGORIES
    .flatMap((c) => c.tools)
    .filter((t) => t.slug !== currentSlug && t.slug !== "all-tools" && t.slug !== "pricing")
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ready</p>
      {(onDownload || onShare || onProcessAnother) && (
        <MobileDoneActions
          onDownload={onDownload}
          onShare={onShare}
          onProcessAnother={onProcessAnother}
          downloadLabel={downloadLabel}
        />
      )}
      <PostResultSignupNudge />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Try another tool
        </p>
        <div className="space-y-1.5">
          {suggested.map((tool) => (
            <Link key={tool.slug} href={tool.href}>
              <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:bg-muted">
                {tool.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/">
        <span className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors active:bg-muted">
          <Home className="h-4 w-4" />
          Back to Home
        </span>
      </Link>
    </div>
  );
}

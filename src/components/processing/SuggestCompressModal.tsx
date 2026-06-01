"use client";

import { Link } from "wouter";
import { FileArchive, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appPath } from "@/lib/appPaths";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  sizeMb?: number;
  limitMb?: number;
};

/** Shown when a free user exceeds the 15 MB cap — compress or upgrade instead of a dead-end error. */
export function SuggestCompressModal({ open, onOpenChange, fileName, sizeMb, limitMb = 15 }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compress-upsell-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="compress-upsell-title" className="text-lg font-bold text-foreground">
              File is a bit large
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {fileName ? (
                <>
                  <span className="font-medium text-foreground">{fileName}</span>
                  {sizeMb != null ? (
                    <> is {sizeMb.toFixed(1)} MB — free limit is {limitMb} MB.</>
                  ) : (
                    <> exceeds the {limitMb} MB free limit.</>
                  )}
                </>
              ) : (
                <>Free accounts can upload up to {limitMb} MB per file.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Link href={appPath("/compress-pdf")} onClick={() => onOpenChange(false)}>
            <Button type="button" className="press-scale min-h-[48px] w-full gap-2 text-base font-semibold">
              <FileArchive className="h-5 w-5" />
              Compress PDF first
            </Button>
          </Link>
          <Link href={appPath("/pricing")} onClick={() => onOpenChange(false)}>
            <Button
              type="button"
              variant="outline"
              className="press-scale min-h-[48px] w-full gap-2 text-base font-semibold"
            >
              <Crown className="h-5 w-5 text-amber-500" />
              Upgrade to Premium (500 MB)
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="min-h-[44px] w-full"
            onClick={() => onOpenChange(false)}
          >
            Choose a smaller file
          </Button>
        </div>
      </div>
    </div>
  );
}

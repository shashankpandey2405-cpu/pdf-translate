"use client";

import { Download, Share2, Trash2 } from "lucide-react";
import { GlassPanel } from "@/components/desktop/GlassPanel";
import { SmartNextActions } from "@/components/desktop/SmartNextActions";
import type { DesktopNextAction } from "@/lib/desktop/toolMeta";

type Props = {
  title: string;
  onDownload?: () => void;
  onShare?: () => void;
  onReset: () => void;
  nextActions?: DesktopNextAction[];
};

export function MasterToolDonePanel({ title, onDownload, onShare, onReset, nextActions }: Props) {
  return (
    <>
      <GlassPanel className="border-emerald-500/30 bg-emerald-500/5 p-5" variant="elevated">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Done</p>
        <p className="mt-2 text-lg font-semibold text-foreground">{title}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md disabled:opacity-50"
            disabled={!onDownload}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={!onShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </GlassPanel>
      <SmartNextActions actions={nextActions} />
    </>
  );
}

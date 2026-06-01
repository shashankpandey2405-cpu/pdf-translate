"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import { RefreshCw } from "lucide-react";
import { DesktopStepRow } from "@/components/desktop/wizard/DesktopStepRow";
import { ToolIcon } from "@/components/home/ToolIcon";
import { getConverterTargetsForFile, type ConverterTarget } from "@/lib/desktop/converterTargets";
import { handoffFileToTool } from "@/lib/desktop/toolHandoff";

type Props = {
  file: File;
  onReset: () => void;
};

export function DesktopConvertPickPanel({ file, onReset }: Props) {
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState<string | null>(null);
  const targets = getConverterTargetsForFile(file);

  const pick = async (target: ConverterTarget) => {
    setBusy(target.slug);
    try {
      const href = await handoffFileToTool(file, target.slug);
      navigate(href);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Convert to:</p>
          <p className="text-xs text-muted-foreground">Choose output — your file carries over</p>
        </div>
      </div>
      <div className="space-y-2">
        {targets.map((t) => (
          <DesktopStepRow
            key={t.slug}
            iconNode={<ToolIcon slug={t.slug} className="h-5 w-5 text-primary" />}
            title={t.label}
            subtitle={t.description}
            disabled={Boolean(busy)}
            onClick={() => void pick(t)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-center text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Upload a different file
      </button>
    </div>
  );
}

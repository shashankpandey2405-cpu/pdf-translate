"use client";

import type { ReactNode } from "react";
import { Crown, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  AI_TIER_COPY,
  type AiSummarizeTier,
  type SummaryLength,
  SUMMARY_LENGTH_LABELS,
} from "@/lib/ai/summarizeTier";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: AiSummarizeTier;
  onTierChange: (tier: AiSummarizeTier) => void;
  length: SummaryLength;
  onLengthChange: (length: SummaryLength) => void;
  isPremium: boolean;
  onContinue: () => void;
  onGoPricing: () => void;
};

const LENGTH_STEPS: SummaryLength[] = ["short", "medium", "long"];

export function AiTierPickerModal({
  open,
  onOpenChange,
  tier,
  onTierChange,
  length,
  onLengthChange,
  isPremium,
  onContinue,
  onGoPricing,
}: Props) {
  const lengthIndex = LENGTH_STEPS.indexOf(length);
  const advancedLocked = tier === "advanced" && !isPremium;

  const handleSlider = (values: number[]) => {
    const idx = values[0] ?? 1;
    onLengthChange(LENGTH_STEPS[Math.min(2, Math.max(0, idx))] ?? "medium");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Choose how AI should summarize your PDF.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm font-medium">Length</p>
          <Slider value={[lengthIndex]} min={0} max={2} step={1} onValueChange={handleSlider} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {LENGTH_STEPS.map((step, i) => (
              <span key={step} className={cn(i === lengthIndex && "font-semibold text-primary")}>
                {SUMMARY_LENGTH_LABELS[step]}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Processing mode</p>
        <div className="space-y-2">
          <TierCard
            selected={tier === "standard"}
            icon={<Sun className="h-5 w-5" />}
            title={AI_TIER_COPY.standard.title}
            subtitle={AI_TIER_COPY.standard.subtitle}
            onClick={() => onTierChange("standard")}
          />
          <TierCard
            selected={tier === "advanced"}
            icon={<Sparkles className="h-5 w-5 text-violet-500" />}
            title={AI_TIER_COPY.advanced.title}
            subtitle={AI_TIER_COPY.advanced.subtitle}
            premium
            onClick={() => onTierChange("advanced")}
          />
        </div>

        {advancedLocked ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Advanced AI is for Premium members. Upgrade to unlock the larger model.
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          {advancedLocked ? (
            <Button type="button" onClick={onGoPricing} className="gap-2">
              <Crown className="h-4 w-4" />
              Get Premium
            </Button>
          ) : (
            <Button type="button" onClick={onContinue} className="gap-2">
              Continue →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TierCard({
  selected,
  icon,
  title,
  subtitle,
  premium,
  onClick,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  premium?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:bg-muted/40",
      )}
    >
      {icon}
      <span className="flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {premium ? <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Premium" /> : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

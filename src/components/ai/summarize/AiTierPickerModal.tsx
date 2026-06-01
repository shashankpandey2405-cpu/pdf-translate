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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AI_TIER_COPY,
  type AiSummarizeTier,
  type SummaryLength,
  SUMMARY_LENGTH_LABELS,
} from "@/lib/ai/summarizeTier";
import { TRANSLATE_LANG_OPTIONS } from "@/lib/ai/translateLanguages";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: AiSummarizeTier;
  onTierChange: (tier: AiSummarizeTier) => void;
  length: SummaryLength;
  onLengthChange: (length: SummaryLength) => void;
  outputLang: string;
  onOutputLangChange: (code: string) => void;
  isPremium: boolean;
  onStart: () => void;
  onGoPricing: () => void;
  starting?: boolean;
};

const LENGTH_OPTIONS: SummaryLength[] = ["short", "medium", "long"];

export function AiTierPickerModal({
  open,
  onOpenChange,
  tier,
  onTierChange,
  length,
  onLengthChange,
  outputLang,
  onOutputLangChange,
  isPremium,
  onStart,
  onGoPricing,
  starting,
}: Props) {
  const advancedLocked = tier === "advanced" && !isPremium;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[min(680px,calc(100vw-2rem))] gap-0 overflow-y-auto p-0">
        <div className="border-b border-border/60 px-6 py-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg">Summary settings</DialogTitle>
            <DialogDescription className="text-sm">Choose length, AI mode, and output language.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Summary length</legend>
            <div className="flex flex-wrap gap-2">
              {LENGTH_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors",
                    length === opt
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="summary-length"
                    className="sr-only"
                    checked={length === opt}
                    onChange={() => onLengthChange(opt)}
                  />
                  {SUMMARY_LENGTH_LABELS[opt]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Processing mode</legend>
            <div className="space-y-2">
              <ModeOption
                selected={tier === "standard"}
                icon={<Sun className="h-4 w-4" />}
                title={AI_TIER_COPY.standard.title}
                subtitle={AI_TIER_COPY.standard.subtitle}
                onSelect={() => onTierChange("standard")}
              />
              <ModeOption
                selected={tier === "advanced"}
                icon={<Sparkles className="h-4 w-4 text-violet-500" />}
                title={AI_TIER_COPY.advanced.title}
                subtitle={AI_TIER_COPY.advanced.subtitle}
                premium
                onSelect={() => onTierChange("advanced")}
              />
            </div>
            {advancedLocked ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Advanced AI requires Premium.
              </p>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="summary-lang" className="text-sm font-medium">
              Summary language
            </Label>
            <Select value={outputLang} onValueChange={onOutputLangChange}>
              <SelectTrigger id="summary-lang" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATE_LANG_OPTIONS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
          {advancedLocked ? (
            <Button type="button" onClick={onGoPricing} className="gap-2">
              <Crown className="h-4 w-4" />
              Get Premium
            </Button>
          ) : (
            <Button type="button" onClick={onStart} disabled={starting} className="min-w-[180px]">
              {starting ? "Starting…" : "Start AI Processing"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeOption({
  selected,
  icon,
  title,
  subtitle,
  premium,
  onSelect,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  subtitle: string;
  premium?: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/40",
      )}
    >
      <input type="radio" name="ai-tier" className="mt-1" checked={selected} onChange={onSelect} />
      <span className="text-primary">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {premium ? <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Premium" /> : null}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </label>
  );
}

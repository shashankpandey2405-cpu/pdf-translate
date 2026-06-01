"use client";

import { TRANSLATE_LANG_OPTIONS } from "@/lib/ai/translateLanguages";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";

type Props = {
  sourceLang: string;
  targetLang: string;
  onSourceChange: (code: string) => void;
  onTargetChange: (code: string) => void;
  onSwap?: () => void;
};

export function TranslateLanguagePicker({
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  onSwap,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          From
        </Label>
        <Select value={sourceLang} onValueChange={onSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Source language" />
          </SelectTrigger>
          <SelectContent className="max-h-[min(280px,50vh)]">
            {TRANSLATE_LANG_OPTIONS.map((l) => (
              <SelectItem key={`s-${l.code}`} value={l.code}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        onClick={() => {
          if (onSwap) onSwap();
          else {
            onSourceChange(targetLang);
            onTargetChange(sourceLang);
          }
        }}
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-muted"
        aria-label="Swap languages"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </button>
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          To
        </Label>
        <Select value={targetLang} onValueChange={onTargetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Target language" />
          </SelectTrigger>
          <SelectContent className="max-h-[min(280px,50vh)]">
            {TRANSLATE_LANG_OPTIONS.map((l) => (
              <SelectItem key={`t-${l.code}`} value={l.code}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

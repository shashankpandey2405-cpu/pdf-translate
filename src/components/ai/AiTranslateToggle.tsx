"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSLATE_LANG_OPTIONS } from "@/lib/ai/translateLanguages";
import { toast } from "sonner";

type Props = {
  text: string;
  className?: string;
};

/** Translate AI assistant text into another language on demand. */
export function AiTranslateToggle({ text, className }: Props) {
  const [lang, setLang] = useState("en");
  const [translated, setTranslated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runTranslate() {
    if (!text.trim()) return;
    setBusy(true);
    setTranslated(null);
    try {
      const res = await fetch("/api/ai/translate-snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, targetLang: lang }),
      });
      const data = (await res.json()) as { translated?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Translation failed");
      setTranslated(data.translated ?? "");
      toast.success("Translation ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not translate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
        <Select value={lang} onValueChange={setLang}>
          <SelectTrigger className="h-9 min-h-[44px] w-[140px]">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {TRANSLATE_LANG_OPTIONS.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px] gap-1"
          disabled={busy || !text.trim()}
          onClick={() => void runTranslate()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Translate
        </Button>
      </div>
      {translated ? (
        <p className="mt-2 rounded-xl border border-border bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {translated}
        </p>
      ) : null}
    </div>
  );
}

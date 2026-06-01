"use client";

import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { content } from "@/tools/redact-pdf/content";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { redactPdf, getRedactedFilename, type RedactPatternKey } from "@/tools/redact-pdf/logic";

const PATTERN_OPTIONS: { key: RedactPatternKey; label: string }[] = [
  { key: "email", label: "Email addresses" },
  { key: "creditCard", label: "Credit card numbers" },
  { key: "phone", label: "Phone numbers" },
];

export default function RedactPdf() {
  const { i18n } = useTranslation();
  const { setMode } = useProcessingMode();
  const [patterns, setPatterns] = useState<RedactPatternKey[]>(["email", "creditCard"]);
  const [customRegex, setCustomRegex] = useState("");

  useEffect(() => {
    setMode("enhanced");
  }, [setMode]);

  const customList = customRegex
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <SinglePdfToolShell
      supportsEnhanced
      slug={content.slug}
      toolLabel="Redact PDF"
      title={content.hero.title}
      subtitle={content.hero.subtitle}
      icon={<EyeOff className="w-5 h-5 text-slate-700" />}
      iconClassName="bg-slate-100"
      steps={content.steps}
      lang={i18n.language}
      canProcess={() => patterns.length > 0 || customList.length > 0}
      cloudOptions={() => ({
        toolSlug: "redact-pdf",
        redactPatterns: patterns,
        redactCustomRegex: customList,
      })}
      configurePanel={() => (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Redact patterns</p>
          <p className="text-xs text-muted-foreground rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <strong>Browser:</strong> black boxes over text (visual only).{" "}
            <strong>Cloud:</strong> true redaction — content removed from the PDF structure.
          </p>
          <div className="space-y-2">
            {PATTERN_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={patterns.includes(opt.key)}
                  onChange={(e) => {
                    setPatterns((prev) =>
                      e.target.checked ? [...prev, opt.key] : prev.filter((k) => k !== opt.key),
                    );
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Custom regex (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. INV-\\d{6}"
              value={customRegex}
              onChange={(e) => setCustomRegex(e.target.value)}
            />
          </div>
        </div>
      )}
      onProcess={async (file) => {
        const bytes = await redactPdf(file, { patterns, customRegex: customList });
        return {
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
          filename: getRedactedFilename(file),
        };
      }}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { Cloud, ScanText, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { analyzePdfDocument, type DocumentAnalysis } from "@/lib/processing/documentAnalysis";
import { requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";

type Props = {
  file: File | null;
  toolSlug: string;
  className?: string;
};

export function DocumentQualityHint({ file, toolSlug, className = "" }: Props) {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file || !file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setAnalysis(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void analyzePdfDocument(file)
      .then((a) => {
        if (!cancelled) setAnalysis(a);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file || loading || !analysis) return null;
  if (requiresCloudOnlyProcessing(toolSlug)) return null;
  if (!analysis.recommendCloud && !analysis.likelyScanned) return null;

  return (
    <div
      className={`rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm ${className}`}
      role="status"
    >
      <p className="flex items-start gap-2 font-medium text-foreground">
        {analysis.recommendOcr ? (
          <ScanText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        ) : (
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        )}
        <span>{analysis.reason}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
        {t("quality.complexity", {
          defaultValue: "Complexity: {{level}}",
          level: analysis.complexity,
        })}
        {analysis.likelyScanned
          ? ` · ${t("quality.scanned", { defaultValue: "Scanned document" })}`
          : null}
      </p>
    </div>
  );
}

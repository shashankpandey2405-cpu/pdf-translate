"use client";

import { useTranslation } from "react-i18next";
import { ResponsiveComparisonTable } from "@/components/layout/ResponsiveComparisonTable";
import { useProcessingMode } from "@/context/ProcessingModeContext";

const ROWS = [
  { key: "speed", browser: "Instant", enhanced: "Faster on large files" },
  { key: "privacy", browser: "Stays on device", enhanced: "Secure cloud upload" },
  { key: "ocr", browser: "Not available", enhanced: "Searchable PDF" },
  { key: "docx", browser: "Basic RTF", enhanced: "High-quality DOCX" },
  { key: "compress", browser: "Good", enhanced: "Stronger optimization" },
  { key: "large", browser: "Device-based (up to ~80MB)", enhanced: "Up to 60MB (signed in)" },
] as const;

export function EnhancedFeatureComparison() {
  const { t } = useTranslation();
  const { enabled } = useProcessingMode();
  if (!enabled) return null;

  const colBrowser = t("enhanced.compareBrowser", { defaultValue: "Browser" });
  const colCloud = t("enhanced.compareCloud", { defaultValue: "Cloud" });

  return (
    <ResponsiveComparisonTable
      colAHeader={colBrowser}
      colBHeader={colCloud}
      rows={ROWS.map((row) => ({
        feature: t(`enhanced.compareRow.${row.key}`, { defaultValue: row.key }),
        colA: row.browser,
        colB: row.enhanced,
      }))}
    />
  );
}

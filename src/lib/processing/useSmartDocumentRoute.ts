"use client";

import { useEffect, useRef, useState } from "react";
import { analyzePdfDocument, type DocumentAnalysis } from "@/lib/processing/documentAnalysis";
import { scoreProcessingRoute } from "@/lib/processing/routingScore";
import { isRoutingV2Enabled } from "@/lib/featureFlags";
import { toolSupportsCloudProcessing } from "@/lib/processing/toolProfiles";
import { useProcessingMode } from "@/context/ProcessingModeContext";

type Options = {
  /** When true, switches to cloud (enhanced) mode when analysis recommends it. */
  autoSelectCloud?: boolean;
};

/**
 * Analyzes uploaded PDFs and recommends browser vs cloud processing.
 * Optionally auto-selects cloud mode for scanned/complex documents.
 */
export function useSmartDocumentRoute(
  file: File | null,
  toolSlug: string,
  options: Options = {},
) {
  const { autoSelectCloud = true } = options;
  const { setMode, enabled: enhancedUiEnabled } = useProcessingMode();
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const autoRoutedRef = useRef(false);

  useEffect(() => {
    autoRoutedRef.current = false;
    if (!file) {
      setAnalysis(null);
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void analyzePdfDocument(file)
      .then((result) => {
        if (cancelled) return;
        setAnalysis(result);
        const routeV2 = isRoutingV2Enabled();
        const score = routeV2
          ? scoreProcessingRoute({
              slug: toolSlug,
              file,
              pageCount: result.pageCount,
              analysis: result,
            })
          : null;

        const shouldAutoCloud = routeV2
          ? score!.recommended === "enhanced" && score!.confidence !== "low"
          : result.recommendCloud ||
            result.likelyScanned ||
            result.documentClass === "image_heavy";

        if (
          autoSelectCloud &&
          enhancedUiEnabled &&
          toolSupportsCloudProcessing(toolSlug) &&
          !autoRoutedRef.current &&
          shouldAutoCloud
        ) {
          autoRoutedRef.current = true;
          setMode("enhanced");
        }
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
  }, [file, toolSlug, autoSelectCloud, enhancedUiEnabled, setMode]);

  const routingScore =
    file && analysis && isRoutingV2Enabled()
      ? scoreProcessingRoute({
          slug: toolSlug,
          file,
          pageCount: analysis.pageCount,
          analysis,
        })
      : null;

  const shouldBlockBrowser = routingScore
    ? routingScore.blockBrowser
    : Boolean(analysis?.likelyScanned) &&
      (toolSlug === "pdf-to-word" || toolSlug === "pdf-to-excel");

  return {
    analysis,
    loading,
    routingScore,
    shouldBlockBrowser,
    recommendCloud: routingScore?.suggestCloud ?? analysis?.recommendCloud ?? false,
    recommendOcr: analysis?.recommendOcr ?? false,
    reason: routingScore?.reasonDefault ?? analysis?.reason ?? "",
  };
}

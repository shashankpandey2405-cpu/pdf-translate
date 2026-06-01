"use client";

import { useEffect, useState } from "react";
import { fetchCreditEstimate, type CreditEstimateResponse } from "@/lib/enhanced/enhancedJobClient";
import { getPDFPageCount } from "@/components/PDFThumbnail";

export function useAiCreditEstimate(
  toolSlug: string,
  file: File | null,
  enabled: boolean,
  processingMode: "ai_plus" | "classic_mt" = "ai_plus",
): {
  estimate: CreditEstimateResponse | null;
  loading: boolean;
  error: string | null;
} {
  const [estimate, setEstimate] = useState<CreditEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !file) {
      setEstimate(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        let pageCount = 1;
        try {
          pageCount = await getPDFPageCount(file);
        } catch {
          pageCount = 1;
        }
        const data = await fetchCreditEstimate({
          toolSlug,
          pageCount,
          fileSize: file.size,
          processingMode,
        });
        if (!cancelled) setEstimate(data);
      } catch (e) {
        if (!cancelled) {
          setEstimate(null);
          setError(e instanceof Error ? e.message : "Could not estimate credits");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toolSlug, file, enabled, processingMode]);

  return { estimate, loading, error };
}

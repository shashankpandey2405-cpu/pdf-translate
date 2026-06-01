"use client";

import { useCallback, useState } from "react";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import type { ProcessingMode } from "@/lib/enhanced/types";
import {
  validateProcessingRequest,
  type ValidationResult,
} from "@/lib/processing/validateProcessingRequest";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import type { DocumentAnalysis } from "@/lib/processing/documentAnalysis";

export function useProcessingValidation(slug: string, analysis?: DocumentAnalysis | null) {
  const { mode, usage } = useProcessingMode();
  const { isSignedIn, isPremium } = usePremium();
  const [limitModal, setLimitModal] = useState<Extract<ValidationResult, { ok: false }> | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const validateFile = useCallback(
    async (file: File, processingMode: ProcessingMode = mode): Promise<boolean> => {
      let pageCount: number | null = null;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        try {
          pageCount = await getPDFPageCount(file);
        } catch {
          pageCount = null;
        }
      }
      const result = validateProcessingRequest({
        slug,
        mode: processingMode,
        file,
        pageCount,
        enhancedRemaining: usage?.enhancedRemaining,
        isSignedIn,
        isPremium,
        analysis,
      });
      if (!result.ok) {
        setLimitModal(result);
        setLimitModalOpen(true);
        return false;
      }
      return true;
    },
    [slug, mode, usage?.enhancedRemaining, isSignedIn, isPremium, analysis],
  );

  const showFallback = useCallback(() => {
    setFallbackOpen(true);
  }, []);

  return {
    validateFile,
    limitModal,
    limitModalOpen,
    setLimitModalOpen,
    fallbackOpen,
    setFallbackOpen,
    showFallback,
  };
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { getProcessingStatusType } from "@/lib/processing/processingStatusType";

type ProcessingPhase = "uploading" | "analyzing" | "processing" | "finalizing";

const PHASE_CONFIG: Record<ProcessingPhase, { label: string; sublabel: string }> = {
  uploading: {
    label: "Uploading your document...",
    sublabel: "Securely transferring your file",
  },
  analyzing: {
    label: "Analyzing document structure...",
    sublabel: "Scanning pages and detecting content",
  },
  processing: {
    label: "Processing with AI...",
    sublabel: "Extracting intelligent insights",
  },
  finalizing: {
    label: "Building your results...",
    sublabel: "Almost ready for download",
  },
};

function getPhase(progress: number): ProcessingPhase {
  if (progress < 15) return "uploading";
  if (progress < 45) return "analyzing";
  if (progress < 85) return "processing";
  return "finalizing";
}

type Props = {
  progress: number;
  title?: string;
  subtitle?: string;
  className?: string;
  slug?: string;
};

export function ProcessingCinematic({ progress, title, subtitle, className, slug }: Props) {
  const phase = getPhase(progress);
  const config = PHASE_CONFIG[phase];
  const displayTitle = title || config.label;
  const type = slug ? getProcessingStatusType(slug) : "cloud";

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 sm:py-16", className)}>
      <ProcessingStatus type={type} progress={progress} label={displayTitle} />
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
          className="mt-3 max-w-xs text-center text-xs text-muted-foreground sm:text-sm"
        >
          {subtitle || config.sublabel}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

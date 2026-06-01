"use client";

import { useEffect } from "react";
import { terminatePdfWorker } from "@/lib/trustShield/pdfWorkerPool";
import { abortPdfJobQueue } from "@/lib/pdfJobQueue";

/** Terminate shared PDF worker when leaving a heavy tool route. */
export function usePdfWorkerCleanup(): void {
  useEffect(
    () => () => {
      abortPdfJobQueue();
      terminatePdfWorker();
    },
    [],
  );
}

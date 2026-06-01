export type RepairPassId = "pdf-lib" | "mupdf-rewrite" | "page-rebuild";

export type RepairMode = "quick" | "deep";

export type RepairPdfReport = {
  success: boolean;
  mode: RepairMode;
  method: RepairPassId;
  passesAttempted: RepairPassId[];
  pageCount: number;
  originalSizeBytes: number;
  outputSizeBytes: number;
  warnings: string[];
};

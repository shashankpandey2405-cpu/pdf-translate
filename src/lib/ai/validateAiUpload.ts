import type { CreditEstimateResponse } from "@/lib/enhanced/enhancedJobClient";

type PrecheckFail = { ok: false; title: string; description: string };
type PrecheckOk = { ok: true };

export function validateAiUploadAgainstEstimate(
  estimate: CreditEstimateResponse | null,
  pages: number,
  fileSize: number,
): PrecheckOk | PrecheckFail {
  if (!estimate) {
    return {
      ok: false,
      title: "Checking credits",
      description: "Wait a moment for the credit estimate, then try again.",
    };
  }

  if (estimate.maxPages != null && pages > estimate.maxPages) {
    return {
      ok: false,
      title: "Too many pages",
      description:
        estimate.limitMessage ??
        `Your balance supports up to ${estimate.maxPages} pages for this file.`,
    };
  }

  if (estimate.maxFileBytes != null && fileSize > estimate.maxFileBytes) {
    return {
      ok: false,
      title: "File too large",
      description:
        estimate.limitMessage ??
        `Maximum file size for your credits is ${Math.round(estimate.maxFileBytes / (1024 * 1024))} MB.`,
    };
  }

  if (!estimate.canProceed) {
    return {
      ok: false,
      title: "Not enough credits",
      description:
        estimate.limitMessage ??
        `This job needs up to ${estimate.estimateHigh} credits (you have ${estimate.credits?.available ?? 0}).`,
    };
  }

  return { ok: true };
}

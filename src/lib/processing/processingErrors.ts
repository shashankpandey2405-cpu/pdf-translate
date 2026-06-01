import { EnhancedJobError } from "@/lib/enhanced/enhancedJobClient";
import { messageForCloudErrorCode } from "@/lib/processing/cloudErrorCodes";

export type ProcessingErrorView = {
  message: string;
  code?: string;
  suggestPremium?: boolean;
  suggestSignIn?: boolean;
  retryable?: boolean;
};

export function mapProcessingError(err: unknown): ProcessingErrorView {
  if (err instanceof EnhancedJobError) {
    const retryable = ![
      "docx_empty_output",
      "excel_no_tables",
      "docx_worker_misconfigured",
    ].includes(err.code);
    return {
      message: messageForCloudErrorCode(err.code, err.message),
      code: err.code,
      suggestPremium: err.code.startsWith("docx_") || err.code.startsWith("excel_"),
      retryable,
    };
  }

  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("docx_ocr_timeout") || lower.includes("docx_empty")) {
    return {
      message: messageForCloudErrorCode(
        lower.includes("timeout") ? "docx_ocr_timeout" : "docx_empty_output",
        raw,
      ),
      retryable: true,
    };
  }
  if (lower.includes("excel_no_tables")) {
    return { message: messageForCloudErrorCode("excel_no_tables", raw), retryable: true };
  }
  if (lower.includes("office_convert")) {
    return { message: messageForCloudErrorCode("office_convert_failed", raw), retryable: true };
  }

  if (lower.includes("redis") || lower.includes("queue not configured")) {
    return {
      message: messageForCloudErrorCode("redis_unavailable", raw),
      code: "redis_unavailable",
      retryable: true,
    };
  }
  if (lower.includes("page count mismatch") || lower.includes("page_count_mismatch")) {
    return {
      message: messageForCloudErrorCode("page_count_mismatch", raw),
      code: "page_count_mismatch",
      retryable: true,
    };
  }
  if (lower.includes("mime_mismatch") || lower.includes("mime mismatch")) {
    return {
      message: messageForCloudErrorCode("mime_mismatch", raw),
      code: "mime_mismatch",
      retryable: true,
    };
  }
  if (lower.includes("insufficient_credits") || lower.includes("not enough ai credits")) {
    return {
      message: messageForCloudErrorCode("INSUFFICIENT_CREDITS", raw),
      code: "INSUFFICIENT_CREDITS",
      retryable: false,
    };
  }
  if (lower.includes("cancelled")) {
    return { message: "Processing was cancelled.", retryable: true };
  }
  if (lower.includes("daily") && lower.includes("limit")) {
    return {
      message: raw,
      code: "DAILY_LIMIT",
      suggestPremium: false,
      retryable: false,
    };
  }
  if (lower.includes("enhanced_unavailable") || lower.includes("not configured")) {
    return {
      message: "Cloud processing is temporarily unavailable. Try browser mode or check back shortly.",
      code: "CLOUD_UNAVAILABLE",
      retryable: true,
    };
  }
  if (lower.includes("queue") || lower.includes("busy")) {
    return {
      message: "Cloud processing is busy right now. Please wait a moment or use browser mode.",
      code: "QUEUE_BUSY",
      suggestPremium: false,
      retryable: true,
    };
  }
  if (lower.includes("upload") && lower.includes("fail")) {
    return {
      message: "Cloud upload failed. Check your connection and try again.",
      retryable: true,
    };
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return {
      message: "Cloud processing took too long. Try browser mode or a smaller file.",
      suggestPremium: false,
      retryable: true,
    };
  }
  if (lower.includes("download link")) {
    return { message: raw, retryable: true };
  }
  if (lower.includes("too_many_pages") || lower.includes("pages")) {
    return { message: raw, suggestPremium: true, retryable: false };
  }
  if (lower.includes("file_too_large") || lower.includes("too large")) {
    return { message: raw, suggestPremium: true, retryable: false };
  }

  return {
    message: raw || "Processing failed. Try again or use cloud processing for better results.",
    suggestPremium: true,
    retryable: true,
  };
}

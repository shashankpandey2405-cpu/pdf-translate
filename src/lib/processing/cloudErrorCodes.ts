/** Maps worker error_code values to user-facing cloud messages (Phase 1). */

const CODE_MESSAGES: Record<string, string> = {
  docx_ocr_timeout:
    "PDF to Word took too long. Try a smaller file, fewer pages, or run OCR PDF first on scanned documents.",
  docx_empty_output:
    "The Word file could not be built. The PDF may be scanned, protected, or corrupted — try OCR PDF first, then Cloud again.",
  docx_convert_failed:
    "This PDF could not be converted to Word. Use Cloud mode on a text-based PDF or OCR PDF for image scans.",
  docx_worker_misconfigured:
    "Cloud Word conversion is temporarily misconfigured. Please try again later or contact support.",
  excel_no_tables:
    "No tables were found. For bank statements use a text PDF; for scans run OCR PDF first.",
  excel_empty_output:
    "Excel output was empty. Ensure the PDF contains tables or extractable text.",
  excel_processing_timeout:
    "PDF to Excel timed out. Try fewer pages or a smaller file.",
  office_convert_failed:
    "Could not convert to PDF. Upload a valid .docx or .doc file saved from Microsoft Word.",
  office_empty_pdf:
    "The PDF output was invalid. Re-save the document in Word and try again.",
  office_processing_timeout:
    "Word to PDF timed out. Try a smaller document.",
  processing_timeout:
    "Cloud processing timed out. Wait a moment and try again, or use browser mode where available.",
  worker_unreachable:
    "Cloud workers did not start your job. Wait a moment and try again. If this keeps happening, the AI or document worker service may be offline — check OPENROUTER_API_KEY, REDIS_URL, and Railway worker deploys.",
  ai_worker_unreachable:
    "AI job stayed queued. On Vercel set OPENROUTER_API_KEY + REDIS_URL (same Redis as workers). Optional: Railway AI service (npm run worker:ai) or AI_QUEUE_DRAIN_ON_VERCEL=true. Check /api/ai/health after deploy.",
  output_missing:
    "Processing finished without a download file. Please retry.",
  processing_failed:
    "Cloud processing failed. Please try again.",
  ai_trial_used:
    "Your free AI trial is already used (1 per account).",
  ai_not_configured:
    "AI cloud is not configured yet. Add OPENROUTER_API_KEY on the server.",
  openrouter_insufficient_credits:
    "OpenRouter credits are low. Top up your OpenRouter balance and try again.",
  openrouter_rate_limited:
    "AI is busy (rate limit). Wait a moment and try again.",
  openrouter_request_failed:
    "OpenRouter request failed. Check your API key and model settings.",
  openrouter_blocked:
    "The AI model could not process this document. Try OCR first or a different file.",
  openrouter_upstream_error:
    "AI provider is temporarily unavailable. Please try again shortly.",
  INSUFFICIENT_CREDITS:
    "Not enough AI credits. Buy extra credit packs from Pricing when your balance is low.",
  redis_unavailable:
    "Cloud queue is unreachable. Server admins: verify REDIS_URL on Vercel matches Railway public TCP URL.",
  page_count_mismatch:
    "Page count could not be verified. Re-upload the file or try browser mode.",
  mime_mismatch:
    "File type mismatch. Save the document in the standard format (.pdf, .docx) and try again.",
  upload_not_found:
    "Upload did not finish storing. Check your connection and try again.",
  PREMIUM_REQUIRED:
    "Subscribe to Premium first to use AI credits. Your free trial is exhausted.",
  needs_ocr:
    "We couldn't read enough text from this scan. Try a clearer photo, or use OCR PDF / Smart Scan AI first.",
  needs_ai_translate:
    "This PDF needs AI translation (scanned or weak text). Classic translate only works on digital PDFs with selectable text.",
  classic_mt_unavailable:
    "Classic translation is not available yet. Deploy translate-mt and set TRANSLATE_MT_URL on the server.",
};

export function messageForCloudErrorCode(
  code: string | null | undefined,
  fallbackMessage?: string | null,
): string {
  if (!code) {
    return fallbackMessage?.trim() || CODE_MESSAGES.processing_failed;
  }
  const raw = code.trim();
  const mapped = CODE_MESSAGES[raw] ?? CODE_MESSAGES[raw.toLowerCase()];
  const fb = fallbackMessage?.trim();
  if (mapped && fb) {
    const fbLower = fb.toLowerCase();
    const mappedLower = mapped.toLowerCase();
    if (
      fb === mapped
      || fbLower.includes(mappedLower)
      || mappedLower.includes(fbLower.slice(0, 48))
    ) {
      return mapped;
    }
    return `${mapped} ${fb.slice(0, 120)}`.trim();
  }
  return mapped ?? fb ?? CODE_MESSAGES.processing_failed;
}

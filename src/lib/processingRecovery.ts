import { isConversionError, type ConversionError } from "@/tools/conversions/ConversionError";
import { toast } from "@/hooks/use-toast";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRetryableConversionError(e: ConversionError): boolean {
  return e.code === "UNKNOWN";
}

function shouldRetryPipelineError(e: unknown): boolean {
  if (isConversionError(e)) return isRetryableConversionError(e);
  return true;
}

type SilentRecoveryOptions = {
  /** Total attempts including the first try. */
  maxAttempts?: number;
  baseDelayMs?: number;
  /** i18n function for optional retry toast */
  t?: (key: string) => string;
};

/**
 * Retries flaky browser-side PDF work (transient wasm / worker hiccups) without alarming copy.
 */
export async function withSilentRecovery<T>(run: () => Promise<T>, options: SilentRecoveryOptions = {}): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 450;
  const t = options.t;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await run();
    } catch (e) {
      lastError = e;
      if (!shouldRetryPipelineError(e) || attempt >= maxAttempts) {
        throw e;
      }
      if (attempt === 1) {
        toast({
          title: t?.("processingRecovery.retryTitle") ?? "Optimizing for your file…",
          description: t?.("processingRecovery.retryDesc") ?? "A quick retry usually clears this.",
        });
      }
      await delay(baseDelayMs * attempt);
    }
  }

  throw lastError;
}

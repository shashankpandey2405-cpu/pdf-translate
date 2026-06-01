"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Star, Upload, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useOverlaySlot } from "@/context/OverlayPriorityContext";
import {
  dismissFeedbackModal,
  isFeedbackModalEnabled,
  subscribeFeedbackTrigger,
} from "@/lib/feedback/feedbackTrigger";
import { logConversionEvent } from "@/utils/logger";

type PendingContext = {
  toolName: string;
  pageUrl?: string;
};

export function PostSuccessFeedbackModal() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<PendingContext | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { visible } = useOverlaySlot("feedbackModal", open);

  useEffect(() => {
    if (!isFeedbackModalEnabled()) return;
    return subscribeFeedbackTrigger((c) => {
      setCtx(c);
      setOpen(true);
      setRating(null);
      setText("");
      setScreenshot(null);
      setDone(false);
      setError(null);
      logConversionEvent("feedback_modal_scheduled", { tool: c.toolName });
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    dismissFeedbackModal();
    logConversionEvent("feedback_modal_dismissed");
  }, []);

  const onSubmit = useCallback(async () => {
    if (!rating || !ctx) return;
    setSubmitting(true);
    setError(null);
    try {
      let screenshotBase64: string | undefined;
      if (screenshot && screenshot.size <= 2 * 1024 * 1024) {
        const buf = await screenshot.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
        screenshotBase64 = btoa(binary);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating,
          feedbackText: text,
          toolName: ctx.toolName,
          pageUrl: ctx.pageUrl ?? (typeof window !== "undefined" ? window.location.pathname : ""),
          deviceInfo: {
            platform: navigator.platform,
            language: navigator.language,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
          screenshotBase64,
          screenshotMime: screenshot?.type,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? "Submit failed");
      }
      setDone(true);
      logConversionEvent("feedback_submitted", { rating, tool: ctx.toolName });
      window.setTimeout(() => close(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }, [rating, text, screenshot, ctx, close]);

  if (!open || !visible || !ctx) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className={cn(
          "relative flex w-full max-w-md flex-col gap-4 rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl",
          "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        )}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <h2 id="feedback-modal-title" className="pr-8 text-lg font-bold text-foreground">
            {t("conversion.feedback.title", { defaultValue: "How was your experience?" })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("conversion.feedback.trust", {
              defaultValue:
                "Every feedback is carefully reviewed and helps improve the platform experience.",
            })}
          </p>
        </div>

        {done ? (
          <p className="text-center text-sm font-medium text-emerald-600">
            {t("conversion.feedback.thanks", { defaultValue: "Thank you for helping us improve!" })}
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("conversion.feedback.ratingLabel", { defaultValue: "Rating (1–10)" })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={cn(
                      "flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border text-sm font-semibold transition",
                      rating === n
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="feedback-text" className="mb-1 block text-xs font-semibold text-muted-foreground">
                {t("conversion.feedback.textLabel", { defaultValue: "Your feedback (optional)" })}
              </label>
              <textarea
                id="feedback-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder={t("conversion.feedback.placeholder", {
                  defaultValue: "What worked well? What could be better?",
                })}
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Upload className="h-3.5 w-3.5" />
                {t("conversion.feedback.screenshotLabel", { defaultValue: "Screenshot (optional, max 2MB)" })}
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="w-full text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              />
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <button
              type="button"
              disabled={!rating || submitting}
              onClick={() => void onSubmit()}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              {t("conversion.feedback.submit", { defaultValue: "Submit feedback" })}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

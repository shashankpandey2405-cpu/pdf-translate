"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { docxBlobToPreviewHtml, docxBlobToPreviewText } from "@/lib/docx/docxToPreviewHtml";
import { sanitizePreviewHtml } from "@/lib/sanitizePreviewHtml";

type Props = {
  blob: Blob;
  className?: string;
};

/** Renders Word (.docx) output as scrollable HTML in the browser. */
export function DocxHtmlPreview({ blob, className }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setError(null);

    void (async () => {
      try {
        const quickText = await docxBlobToPreviewText(blob);
        if (cancelled) return;
        if (quickText) {
          setHtml(
            sanitizePreviewHtml(
              `<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">${quickText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</pre>`,
            ),
          );
        }

        const rich = sanitizePreviewHtml(await docxBlobToPreviewHtml(blob));
        if (!cancelled && rich) setHtml(rich);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Preview failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (error && !html) {
    return (
      <p className="p-4 text-center text-xs text-muted-foreground">
        Word preview could not load. Download the file to open in Word or Google Docs.
      </p>
    );
  }

  if (!html) {
    return (
      <div className="flex min-h-[200px] items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading Word preview…
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "docx-preview prose prose-sm max-w-none overflow-x-auto overflow-y-auto p-4 text-foreground [&_table]:w-full [&_table]:table-fixed [&_td]:break-words [&_th]:break-words"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

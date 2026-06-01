"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
    Sentry.captureException(error, {
      tags: { route_name: "global_error", error_channel: "next_global_error" },
      extra: { digest: error.digest },
    });
  }, [error]);
  return (
    <html lang="en" dir="ltr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#fafafa" }}>
        <main>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 48, fontWeight: 700, color: "#3b82f6", margin: 0 }}>500</p>
            <h1 style={{ fontSize: 20, marginTop: 16 }}>PDFTrusted is temporarily unavailable</h1>
            <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 360 }}>Please refresh or try again in a moment.</p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: 24, padding: "10px 20px", borderRadius: 12, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

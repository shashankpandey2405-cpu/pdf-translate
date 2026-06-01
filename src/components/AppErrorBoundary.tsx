"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@sentry/nextjs";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { error: Error | null };

const EXTERNAL_ERROR_PATTERNS = [
  "suggestReflections",
  "vercel-toolbar",
  "__VERCEL",
  "crisp",
  "intercom",
  "cloudflare",
  "Minified React error #418",
  "Hydration failed",
  "removeChild",
  "NotFoundError",
  "There was an error while hydrating",
];

function isExternalError(error: Error): boolean {
  const msg = error?.message || "";
  const stack = error?.stack || "";
  return EXTERNAL_ERROR_PATTERNS.some(
    (p) => msg.includes(p) || stack.includes(p),
  );
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    if (isExternalError(error)) return { error: null };
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isExternalError(error)) return;
    console.error("[AppErrorBoundary]", error, info.componentStack);
    try {
      captureException(error, { extra: { componentStack: info.componentStack } });
    } catch {
      /* Sentry optional */
    }
  }

  private handleRetry = () => {
    this.setState({ error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center"
        role="alert"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          {this.props.fallbackTitle ?? "This page hit an unexpected error"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your files were not uploaded by this error screen. Try refreshing, or go back and run the tool again.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <pre className="mt-4 max-h-32 w-full overflow-auto rounded-lg bg-muted/50 p-3 text-left text-[10px] text-muted-foreground">
            {this.state.error?.message}
          </pre>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Reload page
          </button>
          <a
            href="/"
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}

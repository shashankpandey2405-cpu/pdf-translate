"use client";

import type { ReactNode } from "react";
import { Link } from "wouter";
import { isInternalOpsAllowed } from "@/lib/internalOps";

export function InternalRouteGuard({ children }: { children: ReactNode }) {
  if (!isInternalOpsAllowed()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Page not available</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Internal QA tools are disabled on this site. Set{" "}
          <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_ALLOW_INTERNAL_OPS=true</code> on Vercel only if
          you need owner diagnostics.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

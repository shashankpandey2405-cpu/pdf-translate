"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Max content width — default full width for processing, 900 for results */
  maxWidth?: "full" | "chat" | "result";
};

const WIDTH = {
  full: "max-w-3xl",
  chat: "max-w-5xl w-[min(100%,80vw)]",
  result: "max-w-[900px]",
} as const;

/** Centered single-step layout — upload, processing, or result focus. */
export function AiFocusShell({ children, className, maxWidth = "full" }: Props) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6 sm:py-10", className)}>
      <div className={cn("w-full", WIDTH[maxWidth])}>{children}</div>
    </div>
  );
}

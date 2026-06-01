import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Default max width for tool pages */
  wide?: boolean;
};

/**
 * Prevents horizontal cut-off on mobile (safe areas, min-w-0, no overflow bleed).
 */
export function AppPageShell({ children, className, wide }: Props) {
  return (
    <div
      className={cn(
        "app-page mx-auto w-full min-w-0 max-w-[100vw] box-border",
        wide ? "max-w-7xl" : "max-w-5xl",
        "px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]",
        "py-6 sm:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

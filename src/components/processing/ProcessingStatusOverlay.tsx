"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { ProcessingStatus, type ProcessingStatusProps } from "@/components/processing/ProcessingStatus";
import { cn } from "@/lib/utils";

type Props = ProcessingStatusProps & {
  active: boolean;
  children: ReactNode;
  className?: string;
};

/** Blurs tool input area and centers processing animation while work is in flight. */
export function ProcessingStatusOverlay({
  active,
  children,
  className,
  ...statusProps
}: Props) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <div className={cn(active && "pointer-events-none select-none opacity-60 blur-[1px]")}>{children}</div>
      <AnimatePresence>
        {active ? (
          <motion.div
            key="processing-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-background/40 backdrop-blur-md"
          >
            <ProcessingStatus {...statusProps} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

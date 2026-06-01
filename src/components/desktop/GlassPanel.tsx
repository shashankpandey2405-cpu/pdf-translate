"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "dark";
};

export function GlassPanel({ children, className, variant = "default" }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl transition-shadow duration-300",
        variant === "default" && "border-border/80 bg-card/85 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]",
        variant === "elevated" &&
          "border-white/60 bg-white/90 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.18)]",
        variant === "dark" && "border-white/10 bg-slate-950/80 text-white shadow-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

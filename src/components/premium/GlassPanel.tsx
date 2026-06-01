import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

export function GlassPanel({ children, className, as: Tag = "div" }: Props) {
  const Component = Tag === "section" ? "section" : Tag === "article" ? "article" : "div";
  return (
    <Component
      className={cn(
        "rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20",
        className,
      )}
    >
      {children}
    </Component>
  );
}

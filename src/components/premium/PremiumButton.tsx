import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  href?: string;
  className?: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  type?: "button" | "submit";
};

const base =
  "tap-haptic touch-manipulation inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-200 active:scale-95";

export function PremiumButton({ children, href, className, variant = "primary", onClick, type = "button" }: Props) {
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-indigo-500/35 shimmer-btn"
      : "border border-slate-200/60 bg-white/70 text-foreground backdrop-blur-md hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900/70 dark:hover:bg-slate-800/80";

  if (href) {
    return (
      <Link href={href} className={cn(base, styles, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cn(base, styles, className)}>
      {children}
    </button>
  );
}

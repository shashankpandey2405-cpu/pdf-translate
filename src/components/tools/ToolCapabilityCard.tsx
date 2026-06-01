"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Props = {
  features: Feature[];
  className?: string;
};

export function ToolCapabilityCards({ features, className }: Props) {
  if (!features.length) return null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {features.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

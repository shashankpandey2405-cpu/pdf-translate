"use client";

import { Settings2 } from "lucide-react";
import { useToolRightRail } from "@/context/ToolRightRailContext";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Shown when panel is collapsed — nudges user to open options */
  showBadge?: boolean;
};

export function DesktopRightRailGear({ className, showBadge }: Props) {
  const { isOpen, toggleRail } = useToolRightRail();

  return (
    <button
      type="button"
      onClick={toggleRail}
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/90 shadow-sm transition hover:bg-white",
        isOpen && "border-primary/40 ring-2 ring-primary/15",
        className,
      )}
      aria-label={isOpen ? "Hide tool options panel" : "Show tool options panel"}
      aria-expanded={isOpen}
      title={isOpen ? "Hide options" : "Show options"}
    >
      <Settings2 className={cn("h-[18px] w-[18px]", isOpen ? "text-primary" : "text-muted-foreground")} />
      {showBadge && !isOpen ? (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
      ) : null}
    </button>
  );
}

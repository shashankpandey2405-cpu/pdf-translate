import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Minimum table width before horizontal scroll kicks in */
  minWidth?: string;
  showScrollHint?: boolean;
};

export function ResponsiveTable({
  children,
  className,
  minWidth = "600px",
  showScrollHint = true,
}: Props) {
  return (
    <div
      className={cn(
        "my-6 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm",
        className,
      )}
    >
      <div className="table-scroll scrollbar-thin no-scrollbar lg:scrollbar-thin">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
      {showScrollHint ? (
        <div className="border-t border-border/40 bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground lg:hidden">
          ← Scroll horizontally to see more →
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** When true, the background remains scrollable while the sheet is open. */
  preventScrollLock?: boolean;
};

export function MobileToolOptionsSheet({
  open,
  onOpenChange,
  title = "Options",
  children,
  footer,
  preventScrollLock,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={!preventScrollLock}>
      <SheetContent
        side="right"
        className="flex w-[60vw] max-w-[24rem] flex-col overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-5 w-5 text-primary" />
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

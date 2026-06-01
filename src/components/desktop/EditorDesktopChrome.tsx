"use client";

import type { ReactNode } from "react";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";

/** Editor/sign tools — category sidebar on desktop + full-height workspace (single mount for all breakpoints). */
export function EditorDesktopChrome({
  children,
  activeSlug = "pdf-editor",
}: {
  children: ReactNode;
  activeSlug?: string;
}) {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-hidden bg-[hsl(210_20%_98%)]">
      <DesktopMiniSidebar activeSlug={activeSlug} className="hidden shrink-0 lg:flex" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

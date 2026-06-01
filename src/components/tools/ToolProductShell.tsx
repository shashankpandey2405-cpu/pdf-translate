"use client";

import type { ReactNode } from "react";
import ToolSEO from "@/components/ToolSEO";
import { ToolHelpLinks } from "@/components/seo/ToolHelpLinks";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Extra class on main content wrapper */
  className?: string;
  keywords?: string;
  /** Hide help links when tool is in full-screen editor mode */
  showHelpLinks?: boolean;
};

/**
 * Conversion-focused tool shell: header + workspace + lightweight help links.
 * SEO JSON-LD stays in ToolSEO (head only).
 */
export function ToolProductShell({
  slug,
  title,
  subtitle,
  children,
  className,
  keywords,
  showHelpLinks = true,
}: Props) {
  return (
    <>
      <ToolSEO title={title} description={subtitle} slug={slug} keywords={keywords} />
      <div className={cn("mx-auto w-full min-w-0", className)}>
        <header className="mb-4 min-w-0 px-4 pt-2 sm:px-0 lg:hidden">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{subtitle}</p>
        </header>
        {children}
        {showHelpLinks ? (
          <footer className="mt-6 border-t border-border/40 px-4 py-4 sm:px-0">
            <ToolHelpLinks slug={slug} toolName={title} />
          </footer>
        ) : null}
      </div>
    </>
  );
}

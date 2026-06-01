"use client";

import type { ReactNode } from "react";
import ToolSEO from "@/components/ToolSEO";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { ToolHelpLinks } from "@/components/seo/ToolHelpLinks";

type Props = {
  children: ReactNode;
  slug: string;
  toolName: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string;
  onReset?: () => void;
  /** @deprecated SEO content lives on /guides and /faq */
  mobileSeoFooter?: boolean;
  seoFooterDesktop?: boolean;
  footerExtra?: ReactNode;
};

/** Standard tool route: error boundary + head SEO only (no body SEO clutter). */
export function ToolRouteShell({
  children,
  slug,
  toolName,
  seoTitle,
  seoDescription,
  seoKeywords,
  onReset,
}: Props) {
  return (
    <>
      <div className="lg:hidden px-4 pt-4">
        <ToolSEO title={seoTitle} description={seoDescription} slug={slug} keywords={seoKeywords} />
      </div>
      <ToolRenderErrorBoundary onReset={onReset}>{children}</ToolRenderErrorBoundary>
      <footer className="hidden border-t border-border/40 px-4 py-4 lg:block lg:px-6">
        <ToolHelpLinks slug={slug} toolName={toolName} />
      </footer>
    </>
  );
}

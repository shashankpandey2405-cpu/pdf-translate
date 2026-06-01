"use client";

import type { ReactNode } from "react";
import { HybridToolChrome } from "@/components/processing/HybridToolChrome";

type Props = {
  children: ReactNode;
  toolSlug?: string;
};

/** @deprecated Prefer HybridToolChrome with toolSlug. */
export function EnhancedToolChrome({ children, toolSlug = "compress-pdf" }: Props) {
  return <HybridToolChrome toolSlug={toolSlug}>{children}</HybridToolChrome>;
}

"use client";

import { Shield } from "lucide-react";
import { PRIVACY_BLURB } from "@/content/trustCopy";

type Props = {
  className?: string;
};

/** Short honest privacy note for tool sidebars / below workspace. */
export function ToolPrivacyNote({ className }: Props) {
  return (
    <p
      className={`flex gap-2 text-xs leading-relaxed text-muted-foreground ${className ?? ""}`}
      role="note"
    >
      <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
      <span>{PRIVACY_BLURB}</span>
    </p>
  );
}

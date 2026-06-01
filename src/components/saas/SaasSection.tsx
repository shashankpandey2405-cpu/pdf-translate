"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  muted?: boolean;
  id?: string;
};

export function SaasSection({ children, className, muted, id }: Props) {
  return (
    <section id={id} className={cn("py-14 sm:py-20", muted && "saas-section-muted", className)}>
      <div className="saas-section">{children}</div>
    </section>
  );
}

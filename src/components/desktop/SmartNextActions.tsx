"use client";

import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GlassPanel } from "@/components/desktop/GlassPanel";
import { ToolIcon } from "@/components/home/ToolIcon";
import type { DesktopNextAction } from "@/lib/desktop/toolMeta";
import { getToolHref } from "../../../constants/tools";

const FALLBACK: DesktopNextAction[] = [
  { slug: "pdf-editor", label: "Edit this PDF", href: getToolHref({ slug: "pdf-editor", routePath: "/pdf-editor" }) },
  { slug: "merge-pdf", label: "Merge with another file", href: getToolHref({ slug: "merge-pdf" }) },
  { slug: "pdf-to-word", label: "Convert to Word", href: getToolHref({ slug: "pdf-to-word" }) },
  { slug: "sign-pdf", label: "Sign document", href: getToolHref({ slug: "sign-pdf", routePath: "/sign-pdf" }) },
  { slug: "translate-pdf", label: "Translate PDF", href: getToolHref({ slug: "translate-pdf" }) },
  { slug: "ai-summarize", label: "Summarize document", href: getToolHref({ slug: "ai-summarize" }) },
];

type Props = {
  actions?: DesktopNextAction[];
};

export function SmartNextActions({ actions = FALLBACK }: Props) {
  return (
    <GlassPanel className="p-4" variant="default">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Smart next actions
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Continue your workflow</p>
      <ul className="mt-4 space-y-2">
        {actions.map((action, i) => (
          <motion.li
            key={action.href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={action.href}>
              <span className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-primary/20 hover:bg-primary/5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/80 text-primary group-hover:bg-primary/10">
                  <ToolIcon slug={action.slug} className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </GlassPanel>
  );
}

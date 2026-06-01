"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { getHelpLinksForTool } from "@/data/help/helpCenterRegistry";
import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  toolName?: string;
  className?: string;
};

/** Lightweight unobtrusive links from tool pages to Help Center content. */
export function ToolHelpLinks({ slug, toolName, className }: Props) {
  const { t } = useTranslation();
  const isLg = useIsLgDesktop();
  const hydrated = useHydrated();
  const links = getHelpLinksForTool(slug);
  const name = toolName ?? slug.replace(/-/g, " ");

  if (hydrated && !isLg) return null;

  return (
    <nav
      aria-label={t("helpCenter.toolHelpNav", { defaultValue: "Help for this tool" })}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}
    >
      <Link href={links.guideHref} className="font-medium text-primary/90 hover:text-primary hover:underline">
        {t("helpCenter.guideLink", { tool: name, defaultValue: `How to use ${name}` })}
      </Link>
      <span aria-hidden className="text-border">
        ·
      </span>
      <Link href={links.faqHref} className="font-medium text-primary/90 hover:text-primary hover:underline">
        {t("helpCenter.faqLink", { tool: name, defaultValue: `${name} FAQ` })}
      </Link>
      <span aria-hidden className="text-border">
        ·
      </span>
      <Link href="/help" className="font-medium text-primary/90 hover:text-primary hover:underline">
        {t("helpCenter.helpHome", { defaultValue: "Help Center" })}
      </Link>
    </nav>
  );
}

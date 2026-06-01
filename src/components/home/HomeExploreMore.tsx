"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const LINKS = [
  { href: "/all-tools", key: "allTools", default: "All tools" },
  { href: "/chat-pdf", key: "aiTools", default: "AI tools" },
  { href: "/compare", key: "compare", default: "Compare" },
  { href: "/how-to-use", key: "howTo", default: "How it works" },
  { href: "/security", key: "security", default: "Security" },
] as const;

/** Lightweight links — deep content lives on dedicated routes, not the homepage. */
export function HomeExploreMore() {
  const { t } = useTranslation();

  return (
    <SaasSection className="border-t border-border/60 py-8 sm:py-10">
      <p className="text-center text-sm text-muted-foreground">
        {t("home.explore.label", { defaultValue: "Explore more" })}
      </p>
      <nav
        className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2"
        aria-label={t("home.explore.nav", { defaultValue: "More pages" })}
      >
        {LINKS.map(({ href, key, default: label }) => (
          <Link
            key={href}
            href={href}
            className="press-scale inline-flex min-h-[44px] items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-muted/50"
          >
            {t(`home.explore.${key}`, { defaultValue: label })}
          </Link>
        ))}
      </nav>
    </SaasSection>
  );
}

"use client";

import { Link, useLocation } from "wouter";
import { FolderOpen, Home, Sparkles, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function pathActive(location: string, path: string) {
  const normalized = location.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  if (path === "/") return normalized === "/" || normalized === "";
  return normalized === path || normalized.startsWith(`${path}/`);
}

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  if (location.includes("internal-tool-suite")) return null;
  if (location.includes("/pdf-editor") || location.includes("/sign-pdf")) return null;

  const items = [
    {
      href: "/",
      label: t("nav.home", { defaultValue: "Home" }),
      icon: Home,
      glow: false,
    },
    {
      href: "/chat-pdf",
      label: t("nav.aiAssistant", { defaultValue: "AI" }),
      icon: Sparkles,
      glow: true,
    },
    {
      href: "/recent",
      label: t("nav.recents", { defaultValue: "Recents" }),
      icon: FolderOpen,
      glow: false,
    },
    {
      href: "/account",
      label: t("nav.profile", { defaultValue: "Profile" }),
      icon: User,
      glow: false,
    },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] w-full max-w-[100vw] overflow-x-hidden border-t border-slate-200/80 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 lg:hidden"
      aria-label={t("nav.mobilePrimary", { defaultValue: "Mobile primary navigation" })}
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around gap-1 px-2">
        {items.map(({ href, label, icon: Icon, glow }) => {
          const active = pathActive(location, href);
          return (
            <li key={href} className="flex min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press-scale flex min-h-[52px] min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[10px] font-semibold transition-colors touch-manipulation",
                  active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center transition-transform duration-200",
                    active && "scale-110 -translate-y-0.5",
                  )}
                >
                  {glow ? (
                    <span
                      className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md dark:bg-indigo-400/25"
                      aria-hidden
                    />
                  ) : null}
                  {active ? (
                    <span
                      className="absolute inset-0 rounded-full bg-indigo-500/15 dark:bg-indigo-400/15"
                      aria-hidden
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "relative h-5 w-5 shrink-0",
                      (active || glow) && "text-indigo-600 dark:text-indigo-400",
                    )}
                    aria-hidden
                  />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

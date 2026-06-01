"use client";

import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { SearchModal } from "@/components/search/SearchModal";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { useWorkspaceHistory } from "@/context/WorkspaceHistoryContext";
import { getToolGroups, getToolHref } from "../../../constants/tools";
import { isToolLive } from "../../../constants/toolStatus";
import { useTranslation } from "react-i18next";
import { FileText, Sparkles, Shield, GraduationCap } from "lucide-react";

const QUICK_ACTIONS = [
  { slug: "pdf-editor", href: "/pdf-editor", icon: FileText, labelKey: null },
  { slug: "merge-pdf", href: "/merge-pdf", icon: FileText, labelKey: null },
  { slug: "compress-pdf", href: "/compress-pdf", icon: FileText, labelKey: null },
  { slug: "chat-pdf", href: "/chat-pdf", icon: Sparkles, labelKey: null },
  { slug: "ai-summarize", href: "/ai-summarize", icon: Sparkles, labelKey: null },
  { slug: "universal-converter", href: "/universal-converter", icon: Sparkles, labelKey: null },
  { slug: "resume-builder", href: "/resume-builder", icon: GraduationCap, labelKey: null },
  {
    slug: "resume-builder",
    href: "/government-resume-builder",
    icon: Shield,
    labelKey: "commandPalette.resumeGovernment",
  },
  {
    slug: "resume-builder",
    href: "/ats-friendly-resume-builder",
    icon: Shield,
    labelKey: "commandPalette.resumeAts",
  },
] as const;

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { entries, canResume, resumeEntry } = useWorkspaceHistory();

  const toolGroups = getToolGroups(t);
  const allTools = useMemo(
    () =>
      toolGroups
        .flatMap((g) => g.items.map((item) => ({ ...item, category: g.category })))
        .filter((item) => isToolLive(item.slug)),
    [toolGroups],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("[cmdk-input]");
      input?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  const recent = entries.slice(0, 5);

  return (
    <SearchModal open={open} onOpenChange={setOpen} showHeader={false}>
      <Command className="rounded-none border-0 bg-transparent shadow-none">
        <div className="flex items-center gap-2 border-b border-border/50 px-2">
          <label htmlFor="global-search" className="sr-only">
            {t("nav.searchTools", { defaultValue: "Search tools" })}
          </label>
          <CommandInput
            id="global-search"
            name="search"
            aria-label={t("nav.searchTools", { defaultValue: "Search tools" })}
            placeholder={t("commandPalette.placeholder", {
              defaultValue: "Find a tool (e.g. Merge, Compress)…",
            })}
            className="h-12 flex-1 border-0"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("commandPalette.close", { defaultValue: "Close search" })}
            className="press-scale mr-2 shrink-0 min-h-[44px] rounded-lg bg-muted px-3 py-2 text-[10px] font-bold"
          >
            ESC
          </button>
        </div>
        <CommandList className="max-h-[min(60dvh,480px)] overflow-y-auto p-2">
          <CommandEmpty>{t("commandPalette.empty")}</CommandEmpty>

          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("commandPalette.popular", { defaultValue: "Popular tools" })}
          </p>

          {recent.length > 0 ? (
            <>
              <CommandGroup heading={t("commandPalette.recent")}>
                {recent.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={`recent ${entry.filename} ${entry.toolSlug}`}
                    disabled={!canResume(entry)}
                    onSelect={() => {
                      void resumeEntry(entry).then((ok) => {
                        if (ok) setOpen(false);
                      });
                    }}
                    className="rounded-2xl"
                  >
                    <FileText className="mr-2 h-4 w-4 opacity-60" aria-hidden />
                    {entry.toolLabel || entry.filename}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          ) : null}

          <CommandGroup heading={t("commandPalette.quick")}>
            {QUICK_ACTIONS.map((action) => {
              const tool = allTools.find((x) => x.slug === action.slug);
              const label = action.labelKey ? t(action.labelKey) : (tool?.label ?? action.slug);
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.href}
                  value={`quick ${label} ${action.slug}`}
                  onSelect={() => {
                    navigate(action.href);
                    setOpen(false);
                  }}
                  className="rounded-2xl"
                >
                  <Icon className="mr-2 h-4 w-4 opacity-60" aria-hidden />
                  {label}
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("commandPalette.allTools")}>
            {allTools.map((tool) => (
              <CommandItem
                key={tool.slug}
                value={`${tool.label} ${tool.desc} ${tool.slug}`}
                onSelect={() => {
                  navigate(getToolHref(tool));
                  setOpen(false);
                }}
                className="rounded-2xl"
              >
                {tool.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </SearchModal>
  );
}

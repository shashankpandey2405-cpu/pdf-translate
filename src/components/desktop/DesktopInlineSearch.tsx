"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { getToolGroups, getToolHref } from "../../../constants/tools";
import { isToolLive } from "../../../constants/toolStatus";
import { useTranslation } from "react-i18next";
import { ToolIcon } from "@/components/home/ToolIcon";
import { cn } from "@/lib/utils";

export function DesktopInlineSearch() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const tools = useMemo(() => {
    return getToolGroups(t)
      .flatMap((g) => g.items.map((item) => ({ ...item, category: g.category })))
      .filter((item) => isToolLive(item.slug));
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools.slice(0, 8);
    return tools.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.slug.includes(q) ||
        item.category.toLowerCase().includes(q),
    ).slice(0, 12);
  }, [query, tools]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        rootRef.current?.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-xl border bg-muted/30 px-3 transition",
          open ? "border-primary/40 bg-white shadow-sm ring-2 ring-primary/10" : "border-border",
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("commandPalette.placeholder", { defaultValue: "Search tools…" })}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground xl:inline">
          ⌘K
        </kbd>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-[min(360px,50vh)] overflow-y-auto rounded-xl border border-border bg-white py-2 shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("commandPalette.empty", { defaultValue: "No tools found" })}
            </p>
          ) : (
            <ul>
              {filtered.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-primary/5"
                    onClick={() => {
                      navigate(getToolHref(item));
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <ToolIcon slug={item.slug} className="h-4 w-4 text-primary" label={undefined} />
                    <span className="flex-1 font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

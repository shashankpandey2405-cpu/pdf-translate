"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TEMPLATE_CATEGORIES, templatesByCategory, type TemplateCategory } from "@/tools/resume/templates";
import { sampleResumeForTemplate } from "@/tools/resume/sampleResume";
import type { ResumeTemplateId } from "@/tools/resume/types";

type Props = {
  selectedId: ResumeTemplateId;
  categoryFilter: TemplateCategory | "all";
  onCategoryChange: (c: TemplateCategory | "all") => void;
  onSelect: (id: ResumeTemplateId) => void;
};

export function TemplateGallery({ selectedId, categoryFilter, onCategoryChange, onSelect }: Props) {
  const { t } = useTranslation();
  const templates = templatesByCategory(categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 touch-manipulation">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${
            categoryFilter === "all" ? "bg-primary text-white border-primary" : "border-border"
          }`}
        >
          {t("resumeStudio.categories.all")}
        </button>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${
              categoryFilter === c.id ? "bg-primary text-white border-primary" : "border-border"
            }`}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tmpl, i) => {
          const sample = sampleResumeForTemplate(tmpl.id);
          return (
            <motion.button
              key={tmpl.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(tmpl.id)}
              className={`rounded-2xl border-2 p-4 text-left transition-all hover:border-primary hover:shadow-lg ${
                selectedId === tmpl.id ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card"
              }`}
            >
              <div className="mb-3 h-36 rounded-lg border border-border overflow-hidden bg-slate-100 relative">
                <div className="absolute inset-0 origin-top-left scale-[0.18] pointer-events-none w-[816px]">
                  <ResumePreview data={sample} exportRootId={`thumb-${tmpl.id}`} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {tmpl.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="font-bold text-foreground">{t(tmpl.labelKey)}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t(tmpl.descKey)}</p>
              {selectedId === tmpl.id ? (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Check className="h-3.5 w-3.5" /> {t("resumeStudio.templateSelected")}
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

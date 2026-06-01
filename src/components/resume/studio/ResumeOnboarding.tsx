"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { TemplateCategory } from "@/tools/resume/templates";

export type OnboardingProfile = "student" | "fresher" | "professional" | "executive";
export type OnboardingFormat = "photo" | "noPhoto" | "government" | "international";

type Props = {
  step: number;
  profile: OnboardingProfile | null;
  format: OnboardingFormat | null;
  onProfile: (p: OnboardingProfile) => void;
  onFormat: (f: OnboardingFormat) => void;
  onComplete: (category: TemplateCategory | "all") => void;
};

const PROFILES: OnboardingProfile[] = ["student", "fresher", "professional", "executive"];
const FORMATS: OnboardingFormat[] = ["photo", "noPhoto", "government", "international"];

const PROFILE_CATEGORY: Record<OnboardingProfile, TemplateCategory> = {
  student: "fresher",
  fresher: "fresher",
  professional: "corporate",
  executive: "executive",
};

const FORMAT_CATEGORY: Record<OnboardingFormat, TemplateCategory | "all"> = {
  photo: "all",
  noPhoto: "corporate",
  government: "government",
  international: "international",
};

export function ResumeOnboarding({ step, profile, format, onProfile, onFormat, onComplete }: Props) {
  const { t } = useTranslation();

  if (step === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h2 className="text-xl font-bold">{t("resumeStudio.onboarding.whoTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("resumeStudio.onboarding.whoDesc")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROFILES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onProfile(p)}
              className={`rounded-2xl border-2 p-4 text-left transition-all hover:border-primary ${
                profile === p ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
              }`}
            >
              <p className="font-semibold">{t(`resumeStudio.onboarding.profile.${p}`)}</p>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (step === 1) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h2 className="text-xl font-bold">{t("resumeStudio.onboarding.formatTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("resumeStudio.onboarding.formatDesc")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFormat(f)}
              className={`rounded-2xl border-2 p-4 text-left transition-all hover:border-primary ${
                format === f ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"
              }`}
            >
              <p className="font-semibold">{t(`resumeStudio.onboarding.format.${f}`)}</p>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  const cat =
    format && format !== "photo"
      ? FORMAT_CATEGORY[format]
      : profile
        ? PROFILE_CATEGORY[profile]
        : "all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
      <p className="text-muted-foreground mb-4">{t("resumeStudio.onboarding.ready")}</p>
      <button
        type="button"
        onClick={() => onComplete(cat)}
        className="rounded-2xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg"
      >
        {t("resumeStudio.onboarding.chooseTemplate")}
      </button>
    </motion.div>
  );
}

export { PROFILE_CATEGORY, FORMAT_CATEGORY };

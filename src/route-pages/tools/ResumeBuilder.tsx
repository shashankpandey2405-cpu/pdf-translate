"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { TrustShieldPrivacyNotice } from "@/components/trustShield/TrustShieldPrivacyNotice";
import { ResumeStudioBadge } from "@/components/resume/ResumeStudioBadge";
import { TemplateGallery } from "@/components/resume/studio/TemplateGallery";
import { ResumeStudioShell } from "@/components/resume/studio/ResumeStudioShell";
import { ResumeModePicker } from "@/components/resume/studio/ResumeModePicker";
import { AiResumeIntakeForm } from "@/components/resume/studio/AiResumeIntakeForm";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { emptyResume, type ResumeData, type ResumeTemplateId } from "@/tools/resume/types";
import { loadResume, saveResume } from "@/tools/resume/storage";
import { type TemplateCategory } from "@/tools/resume/templates";
import { useTranslation } from "react-i18next";
import { useUnsavedNavigationGuard } from "@/hooks/useUnsavedNavigationGuard";
import { isResumeDirty } from "@/tools/resume/isResumeDirty";
import { emptyAiIntake, useAiResumeGenerate } from "@/hooks/useAiResumeGenerate";
import { AiProcessingSteps } from "@/components/mobile/AiProcessingSteps";

const TEMPLATE_STEP_KEY = "pdftrusted-resume-template-step-v1";

type FlowStep = "template" | "mode" | "ai-intake" | "ai-processing" | "editor";

function intentToCategory(intent: string | null): TemplateCategory | "all" {
  if (intent === "government") return "government";
  if (intent === "ats") return "corporate";
  if (intent === "professional") return "corporate";
  return "all";
}

export default function ResumeBuilder() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<ResumeData>(() => emptyResume());
  const [flow, setFlow] = useState<FlowStep>("template");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [aiIntake, setAiIntake] = useState(emptyAiIntake);

  const intent =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("intent") : null;

  const ai = useAiResumeGenerate(data.templateId);

  useEffect(() => {
    const saved = loadResume();
    setData(saved);
    setCategoryFilter(intentToCategory(intent));
    if (typeof window !== "undefined" && sessionStorage.getItem(TEMPLATE_STEP_KEY) === "1" && saved.templateId) {
      setFlow("editor");
    }
  }, [intent]);

  useEffect(() => {
    if (flow === "ai-intake" && aiIntake.about.length > 20) {
      void ai.fetchEstimate(aiIntake);
    }
  }, [flow, aiIntake, ai]);

  const patch = useCallback((fn: (d: ResumeData) => ResumeData) => {
    setData((d) => fn(d));
  }, []);

  function selectTemplate(id: ResumeTemplateId) {
    patch((d) => ({ ...d, templateId: id }));
    setFlow("mode");
  }

  const resetToTemplates = useCallback(() => {
    sessionStorage.removeItem(TEMPLATE_STEP_KEY);
    setFlow("template");
  }, []);

  const startManual = useCallback(() => {
    sessionStorage.setItem(TEMPLATE_STEP_KEY, "1");
    setFlow("editor");
  }, []);

  const startAiIntake = useCallback(() => {
    setAiIntake(emptyAiIntake());
    setFlow("ai-intake");
  }, []);

  const runAiGenerate = useCallback(async () => {
    setFlow("ai-processing");
    const result = await ai.generate(aiIntake);
    if (result) {
      setData(result);
      saveResume(result);
      sessionStorage.setItem(TEMPLATE_STEP_KEY, "1");
      setFlow("editor");
    } else {
      setFlow("ai-intake");
    }
  }, [ai, aiIntake]);

  const seoTitle = t("resumeStudio.seo.title");
  const seoDesc = t("resumeStudio.seo.description");

  useUnsavedNavigationGuard(flow === "editor" && isResumeDirty(data), { confirmPopstate: true });

  const templatePage = (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <ResumeStudioBadge />
      <h1 className="mt-4 text-2xl sm:text-3xl font-bold">{t("resumeStudio.templateTitle")}</h1>
      <p className="mt-2 text-muted-foreground max-w-xl">{t("resumeStudio.templateSubtitle")}</p>
      <div className="mt-8">
        <TemplateGallery
          selectedId={data.templateId}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onSelect={selectTemplate}
        />
      </div>
      <div className="mt-8">
        <TrustShieldPrivacyNotice />
      </div>
    </div>
  );

  const modePage = (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => setFlow("template")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("resumeStudio.changeTemplate")}
      </button>
      <h1 className="text-2xl font-bold">{t("resumeStudio.mode.title", { defaultValue: "How do you want to build?" })}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("resumeStudio.mode.subtitle", { defaultValue: "Choose manual editing or AI-assisted generation." })}
      </p>
      <div className="mt-8">
        <ResumeModePicker onManual={startManual} onAi={startAiIntake} />
      </div>
    </div>
  );

  const aiIntakeContent = (
    <div className="max-w-lg mx-auto w-full">
      <button
        type="button"
        onClick={() => setFlow("mode")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
      <h2 className="text-xl font-bold">{t("resumeStudio.ai.intakeTitle", { defaultValue: "Tell AI about your background" })}</h2>
      {ai.estimate ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("resumeStudio.ai.estimate", {
            defaultValue: "Estimated usage: {{low}}–{{high}} credits (based on your input length).",
            low: ai.estimate.estimate,
            high: ai.estimate.estimateHigh,
          })}
        </p>
      ) : null}
      <AiResumeIntakeForm
        value={aiIntake}
        onChange={(patch) => setAiIntake((prev) => ({ ...prev, ...patch }))}
        className="mt-4"
      />
      {ai.error ? <p className="mt-3 text-sm text-destructive">{ai.error}</p> : null}
    </div>
  );

  const mobileAiPage = (
    <MobileToolLayout
      slug="resume-builder"
      toolLabel={t("resumeStudio.title")}
      title={t("resumeStudio.ai.intakeTitle", { defaultValue: "AI Resume" })}
      workflowStep={flow === "ai-processing" ? "process" : "configure"}
      settingsPanel={
        flow === "ai-intake" ? (
          <AiResumeIntakeForm value={aiIntake} onChange={(patch) => setAiIntake((prev) => ({ ...prev, ...patch }))} />
        ) : undefined
      }
      processButton={
        flow === "ai-intake" ? (
          <button type="button" disabled={ai.busy} onClick={() => void runAiGenerate()} className={TOOL_PRIMARY_BTN}>
            {ai.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {t("resumeStudio.ai.generate", { defaultValue: "Generate with AI" })}
          </button>
        ) : null
      }
    >
      {flow === "ai-processing" ? (
        <AiProcessingSteps progress={65} label={t("resumeStudio.ai.processing", { defaultValue: "Building your resume…" })} />
      ) : (
        aiIntakeContent
      )}
    </MobileToolLayout>
  );

  const desktopPreEditor =
    flow === "template" ? (
      templatePage
    ) : flow === "mode" ? (
      modePage
    ) : flow === "ai-intake" || flow === "ai-processing" ? (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {flow === "ai-processing" ? (
          <ProcessingStatus type="ai" label={t("resumeStudio.ai.processing", { defaultValue: "Building your resume…" })} className="py-16" />
        ) : (
          <>
            {aiIntakeContent}
            <button
              type="button"
              disabled={ai.busy || !aiIntake.fullName || !aiIntake.jobField || aiIntake.about.length < 20}
              onClick={() => void runAiGenerate()}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {ai.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {t("resumeStudio.ai.generate", { defaultValue: "Generate with AI" })}
            </button>
          </>
        )}
      </div>
    ) : null;

  if (flow === "editor") {
    return (
      <ToolRenderErrorBoundary onReset={resetToTemplates}>
        <ToolSEO title={seoTitle} description={seoDesc} slug="resume-builder" lang={i18n.language} />
        <ResumeStudioShell data={data} onPatch={patch} onBackToTemplates={resetToTemplates} />
      </ToolRenderErrorBoundary>
    );
  }

  return (
    <ToolRenderErrorBoundary onReset={resetToTemplates}>
      <ToolSEO title={seoTitle} description={seoDesc} slug="resume-builder" lang={i18n.language} />
      <ToolPageSplit
        desktop={desktopPreEditor}
        mobile={
          flow === "ai-intake" || flow === "ai-processing" ? (
            mobileAiPage
          ) : (
            <div className="px-4 py-6">{flow === "template" ? templatePage : modePage}</div>
          )
        }
      />
    </ToolRenderErrorBoundary>
  );
}

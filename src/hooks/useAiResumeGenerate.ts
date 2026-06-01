"use client";

import { useCallback, useState } from "react";
import type { ResumeData, ResumeTemplateId } from "@/tools/resume/types";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { toast } from "@/hooks/use-toast";

export type AiResumeIntakeClient = {
  jobField: string;
  includePhoto: boolean;
  fullName: string;
  skills: string;
  experience: string;
  education: string;
  about: string;
  photoDataUrl: string | null;
};

export function emptyAiIntake(): AiResumeIntakeClient {
  return {
    jobField: "",
    includePhoto: false,
    fullName: "",
    skills: "",
    experience: "",
    education: "",
    about: "",
    photoDataUrl: null,
  };
}

type Estimate = {
  estimate: number;
  estimateHigh: number;
  canProceed: boolean;
};

export function useAiResumeGenerate(templateId: ResumeTemplateId) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const { resolveSignedIn, requireSignIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();

  const fetchEstimate = useCallback(
    async (intake: AiResumeIntakeClient) => {
      const chars = [
        intake.fullName,
        intake.jobField,
        intake.skills,
        intake.experience,
        intake.education,
        intake.about,
      ].join("\n").length;
      try {
        const res = await fetch("/api/credits/estimate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolSlug: "ai-resume-builder",
            pageCount: 1,
            totalChars: Math.max(chars, 500),
            processingMode: "ai_plus",
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setEstimate({
          estimate: data.estimate ?? 4,
          estimateHigh: data.estimateHigh ?? 6,
          canProceed: Boolean(data.canProceed),
        });
      } catch {
        setEstimate(null);
      }
    },
    [],
  );

  const generate = useCallback(
    async (intake: AiResumeIntakeClient): Promise<ResumeData | null> => {
      setError(null);
      if (!(await resolveSignedIn())) {
        await requireSignIn({
          reason: SIGN_IN_REASON.questionGen,
          tone: "ai",
          deferredAction: "reload",
          toolSlug: "ai-resume-builder",
        });
        return null;
      }

      setBusy(true);
      try {
        const res = await fetch("/api/ai/resume", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...intake,
            templateId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.message || data.error || "Generation failed";
          setError(msg);
          if (res.status === 402) {
            toast({ title: "Not enough credits", description: msg, variant: "destructive" });
          } else {
            toast({ title: "AI Resume failed", description: msg, variant: "destructive" });
          }
          return null;
        }
        toast({
          title: "Resume generated",
          description: "Review and edit in the studio, then download your PDF.",
        });
        return data.resumeData as ResumeData;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [resolveSignedIn, requireSignIn, templateId],
  );

  return {
    busy,
    error,
    estimate,
    fetchEstimate,
    generate,
    requestSignIn,
  };
}

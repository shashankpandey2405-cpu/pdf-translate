"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUploadCrop } from "./PhotoUploadCrop";
import { cn } from "@/lib/utils";
import type { AiResumeIntakeClient } from "@/hooks/useAiResumeGenerate";

type Props = {
  value: AiResumeIntakeClient;
  onChange: (patch: Partial<AiResumeIntakeClient>) => void;
  className?: string;
};

export function AiResumeIntakeForm({ value, onChange, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <Label className="text-xs">Target job / field</Label>
        <Input
          value={value.jobField}
          onChange={(e) => onChange({ jobField: e.target.value })}
          placeholder="e.g. Software Engineer, Marketing Manager"
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Include photo?</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ includePhoto: true })}
            className={cn(
              "flex-1 rounded-xl border py-2 text-sm font-medium",
              value.includePhoto ? "border-primary bg-primary/10 text-primary" : "border-border",
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange({ includePhoto: false, photoDataUrl: null })}
            className={cn(
              "flex-1 rounded-xl border py-2 text-sm font-medium",
              !value.includePhoto ? "border-primary bg-primary/10 text-primary" : "border-border",
            )}
          >
            No
          </button>
        </div>
        {value.includePhoto ? (
          <PhotoUploadCrop
            photo={value.photoDataUrl}
            photoShape="circle"
            onPhotoChange={(url) => onChange({ photoDataUrl: url })}
            onShapeChange={() => {}}
          />
        ) : null}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Full name</Label>
        <Input value={value.fullName} onChange={(e) => onChange({ fullName: e.target.value })} className="h-10" />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Skills</Label>
        <Textarea
          value={value.skills}
          onChange={(e) => onChange({ skills: e.target.value })}
          placeholder="Comma-separated or one per line"
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Experience</Label>
        <Textarea
          value={value.experience}
          onChange={(e) => onChange({ experience: e.target.value })}
          placeholder="Roles, companies, dates, achievements"
          rows={4}
          className="text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Education</Label>
        <Textarea
          value={value.education}
          onChange={(e) => onChange({ education: e.target.value })}
          placeholder="Degrees, schools, years"
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">About you (detailed)</Label>
        <Textarea
          value={value.about}
          onChange={(e) => onChange({ about: e.target.value })}
          placeholder="Career goals, strengths, achievements — at least a few sentences"
          rows={5}
          className="text-sm"
        />
      </div>
    </div>
  );
}

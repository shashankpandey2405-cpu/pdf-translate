"use client";

import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PhotoUploadCrop } from "./PhotoUploadCrop";
import { newEntryId } from "@/tools/resume/storage";
import type { ResumeData, ResumeEntry, ResumeProject, ResumeSectionId } from "@/tools/resume/types";

function FormField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const id = useId();
  const inputCls =
    "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 touch-manipulation";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={inputCls} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      )}
    </div>
  );
}

type Props = {
  data: ResumeData;
  section: ResumeSectionId;
  onPatch: (fn: (d: ResumeData) => ResumeData) => void;
};

export function ResumeSectionPanel({ data, section, onPatch }: Props) {
  const { t } = useTranslation();
  const [skillInput, setSkillInput] = useState("");
  const [hobbyInput, setHobbyInput] = useState("");
  const patch = onPatch;

  const addEntry = (kind: "education" | "internships" | "languages" | "certifications" | "references") => {
    const entry: ResumeEntry = { id: newEntryId(), title: "", subtitle: "", start: "", end: "", details: "" };
    patch((d) => ({ ...d, [kind]: [...d[kind], entry] }));
  };

  const addProject = () => {
    const p: ResumeProject = { id: newEntryId(), name: "", link: "", tech: "", description: "" };
    patch((d) => ({ ...d, projects: [...d.projects, p] }));
  };

  if (section === "header") {
    return (
      <div className="space-y-4">
        <PhotoUploadCrop
          photo={data.profilePhoto}
          photoShape={data.design.photoShape}
          onPhotoChange={(url) => patch((d) => ({ ...d, profilePhoto: url }))}
          onShapeChange={(shape) => patch((d) => ({ ...d, design: { ...d.design, photoShape: shape } }))}
        />
        <FormField
          label={t("resumeStudio.fields.fullName")}
          value={data.personal.fullName}
          onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, fullName: v } }))}
        />
        <FormField
          label={t("resumeStudio.fields.jobTitle")}
          value={data.personal.jobTitle}
          onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, jobTitle: v } }))}
        />
      </div>
    );
  }

  if (section === "summary") {
    return (
      <FormField
        label={t("resumeStudio.fields.summary")}
        value={data.personal.summary}
        onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, summary: v } }))}
        multiline
      />
    );
  }

  if (section === "contact") {
    return (
      <div className="space-y-4">
        <FormField label={t("resumeStudio.fields.email")} value={data.personal.email} onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, email: v } }))} type="email" />
        <FormField label={t("resumeStudio.fields.phone")} value={data.personal.phone} onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, phone: v } }))} type="tel" />
        <FormField label={t("resumeStudio.fields.city")} value={data.personal.city} onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, city: v } }))} />
        <FormField label={t("resumeStudio.fields.address")} value={data.personal.address} onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, address: v } }))} />
        <FormField label={t("resumeStudio.fields.website")} value={data.personal.website} onChange={(v) => patch((d) => ({ ...d, personal: { ...d.personal, website: v } }))} />
      </div>
    );
  }

  if (section === "experience") {
    return (
      <EntrySection
        title={t("resumeStudio.sections.experience")}
        entries={data.internships}
        onAdd={() => addEntry("internships")}
        onRemove={(id) => patch((d) => ({ ...d, internships: d.internships.filter((x) => x.id !== id) }))}
        onUpdate={(i, e) => patch((d) => { const arr = [...d.internships]; arr[i] = e; return { ...d, internships: arr }; })}
        t={t}
      />
    );
  }

  if (section === "education") {
    return (
      <EntrySection
        title={t("resumeStudio.sections.education")}
        entries={data.education}
        onAdd={() => addEntry("education")}
        onRemove={(id) => patch((d) => ({ ...d, education: d.education.filter((x) => x.id !== id) }))}
        onUpdate={(i, e) => patch((d) => { const arr = [...d.education]; arr[i] = e; return { ...d, education: arr }; })}
        t={t}
      />
    );
  }

  if (section === "projects") {
    return (
      <div className="space-y-4">
        <button type="button" onClick={addProject} className="text-primary text-xs font-semibold inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> {t("resumeStudio.add")}
        </button>
        {data.projects.map((p, i) => (
          <div key={p.id} className="rounded-xl border border-border p-3 space-y-3">
            <button type="button" onClick={() => patch((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }))} className="float-right text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
            <FormField label={t("resumeStudio.fields.projectName")} value={p.name} onChange={(v) => patch((d) => { const arr = [...d.projects]; arr[i] = { ...p, name: v }; return { ...d, projects: arr }; })} />
            <FormField label={t("resumeStudio.fields.link")} value={p.link} onChange={(v) => patch((d) => { const arr = [...d.projects]; arr[i] = { ...p, link: v }; return { ...d, projects: arr }; })} />
            <FormField label={t("resumeStudio.fields.tech")} value={p.tech} onChange={(v) => patch((d) => { const arr = [...d.projects]; arr[i] = { ...p, tech: v }; return { ...d, projects: arr }; })} />
            <FormField label={t("resumeStudio.fields.description")} value={p.description} onChange={(v) => patch((d) => { const arr = [...d.projects]; arr[i] = { ...p, description: v }; return { ...d, projects: arr }; })} multiline />
          </div>
        ))}
      </div>
    );
  }

  if (section === "skills") {
    return (
      <div>
        <div className="flex gap-2">
          <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const s = skillInput.trim(); if (s) { patch((d) => ({ ...d, skills: [...d.skills, s] })); setSkillInput(""); } } }} className="flex-1 rounded-xl border px-3 py-2 text-sm" placeholder={t("resumeStudio.fields.skillPlaceholder")} />
          <button type="button" onClick={() => { const s = skillInput.trim(); if (s) { patch((d) => ({ ...d, skills: [...d.skills, s] })); setSkillInput(""); } }} className="rounded-xl bg-primary px-4 text-sm font-semibold text-white">{t("resumeStudio.add")}</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {s}
              <button type="button" onClick={() => patch((d) => ({ ...d, skills: d.skills.filter((x) => x !== s) }))}>×</button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section === "languages" || section === "certifications" || section === "references") {
    const key = section;
    return (
      <EntrySection
        title={t(`resumeStudio.sections.${section}`)}
        entries={data[key]}
        onAdd={() => addEntry(key)}
        onRemove={(id) => patch((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }))}
        onUpdate={(i, e) => patch((d) => { const arr = [...d[key]]; arr[i] = e; return { ...d, [key]: arr }; })}
        t={t}
      />
    );
  }

  if (section === "awards") {
    return (
      <div className="space-y-4">
        <FormField label={t("resumeStudio.fields.awards")} value={data.awards} onChange={(v) => patch((d) => ({ ...d, awards: v }))} multiline />
        <FormField label={t("resumeStudio.fields.additional")} value={data.additionalInfo} onChange={(v) => patch((d) => ({ ...d, additionalInfo: v }))} multiline />
      </div>
    );
  }

  if (section === "hobbies") {
    return (
      <div>
        <div className="flex gap-2">
          <input value={hobbyInput} onChange={(e) => setHobbyInput(e.target.value)} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
          <button type="button" onClick={() => { const h = hobbyInput.trim(); if (h) { patch((d) => ({ ...d, hobbies: [...d.hobbies, h] })); setHobbyInput(""); } }} className="rounded-xl bg-primary px-4 text-sm text-white">{t("resumeStudio.add")}</button>
        </div>
        <p className="mt-2 text-sm">{data.hobbies.join(" · ")}</p>
      </div>
    );
  }

  if (section === "social") {
    return (
      <div className="space-y-4">
        <FormField label="GitHub" value={data.social.github} onChange={(v) => patch((d) => ({ ...d, social: { ...d.social, github: v } }))} />
        <FormField label="LinkedIn" value={data.social.linkedin} onChange={(v) => patch((d) => ({ ...d, social: { ...d.social, linkedin: v } }))} />
        <FormField label={t("resumeStudio.fields.portfolio")} value={data.social.portfolio} onChange={(v) => patch((d) => ({ ...d, social: { ...d.social, portfolio: v } }))} />
      </div>
    );
  }

  return null;
}

function EntrySection({
  title,
  entries,
  onAdd,
  onRemove,
  onUpdate,
  t,
}: {
  title: string;
  entries: ResumeEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (index: number, entry: ResumeEntry) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button type="button" onClick={onAdd} className="text-primary text-xs font-semibold inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> {t("resumeStudio.add")}
        </button>
      </div>
      {entries.map((e, i) => (
        <div key={e.id} className="rounded-xl border border-border p-3 space-y-3">
          <button type="button" onClick={() => onRemove(e.id)} className="float-right text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
          <FormField label={t("resumeStudio.fields.role")} value={e.title} onChange={(v) => onUpdate(i, { ...e, title: v })} />
          <FormField label={t("resumeStudio.fields.company")} value={e.subtitle} onChange={(v) => onUpdate(i, { ...e, subtitle: v })} />
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t("resumeStudio.fields.start")} value={e.start} onChange={(v) => onUpdate(i, { ...e, start: v })} />
            <FormField label={t("resumeStudio.fields.end")} value={e.end} onChange={(v) => onUpdate(i, { ...e, end: v })} />
          </div>
          <FormField label={t("resumeStudio.fields.details")} value={e.details} onChange={(v) => onUpdate(i, { ...e, details: v })} multiline />
        </div>
      ))}
    </div>
  );
}

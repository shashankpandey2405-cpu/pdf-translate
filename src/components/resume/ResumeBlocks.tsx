import type { ReactNode } from "react";
import type { ResumeData, ResumeEntry } from "@/tools/resume/types";
import { previewField, previewClass, formatDateRange } from "@/tools/resume/previewText";

function Ph({ text, isPlaceholder, className = "" }: { text: string; isPlaceholder: boolean; className?: string }) {
  return (
    <span className={previewClass(isPlaceholder, className)} data-placeholder={isPlaceholder ? "1" : undefined}>
      {text}
    </span>
  );
}

export function ResumePhoto({ data, className }: { data: ResumeData; className?: string }) {
  if (!data.profilePhoto) return null;
  const shape =
    data.design.photoShape === "circle"
      ? "rounded-full"
      : data.design.photoShape === "square"
        ? "rounded-none"
        : "rounded-lg";
  return <img src={data.profilePhoto} alt="" className={`object-cover ${shape} ${className ?? "h-24 w-24"}`} />;
}

export function ResumeHeaderBlock({
  data,
  nameClass = "text-2xl",
  showPhoto = true,
  light,
}: {
  data: ResumeData;
  nameClass?: string;
  showPhoto?: boolean;
  light?: boolean;
}) {
  const name = previewField(data.personal.fullName, "[Your Name]");
  const title = previewField(data.personal.jobTitle, "[Job Title]");
  const hasPhoto = Boolean(data.profilePhoto) && showPhoto;
  return (
    <header data-section-id="header" className="flex gap-4 items-start">
      {hasPhoto ? <ResumePhoto data={data} className="h-20 w-20 shrink-0" /> : null}
      <div className={hasPhoto ? "" : "w-full"}>
        <h1 className={`font-bold ${name.isPlaceholder ? "italic text-slate-400" : light ? "text-white" : ""} ${nameClass}`}>
          <Ph text={name.text} isPlaceholder={name.isPlaceholder} />
        </h1>
        {(title.isPlaceholder || data.personal.jobTitle.trim()) && (
          <p className={`text-sm font-medium mt-0.5 ${light ? "text-slate-300" : "text-slate-600"}`}>
            <Ph text={title.text} isPlaceholder={title.isPlaceholder} />
          </p>
        )}
      </div>
    </header>
  );
}

export function Section({ title, children, sectionId }: { title: string; children: ReactNode; sectionId?: string }) {
  return (
    <section data-section-id={sectionId} className="mb-3">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">{title}</h2>
      {children}
    </section>
  );
}

export function ResumeSummaryBlock({ data }: { data: ResumeData }) {
  const summary = previewField(data.personal.summary, "[Professional summary…]");
  return (
    <div data-section-id="summary" className="mb-3">
      <p>
        <Ph text={summary.text} isPlaceholder={summary.isPlaceholder} />
      </p>
    </div>
  );
}

export function ResumeContactBlock({ data, light }: { data: ResumeData; light?: boolean }) {
  const items = [
    previewField(data.personal.email, "[Email]"),
    previewField(data.personal.phone, "[Phone]"),
    previewField(data.personal.city, "[City]"),
    previewField(data.personal.address, ""),
    previewField(data.personal.website, ""),
    previewField(data.social.portfolio, ""),
    previewField(data.social.github, ""),
    previewField(data.social.linkedin, ""),
  ].filter((p) => p.text && !p.isPlaceholder);
  if (items.length === 0) {
    items.push(
      previewField(data.personal.email, "[Email]"),
      previewField(data.personal.phone, "[Phone]"),
      previewField(data.personal.city, "[City]"),
    );
  }
  return (
    <div data-section-id="contact" className={`text-[10px] flex flex-wrap gap-x-2 ${light ? "text-slate-300" : "text-slate-600"}`}>
      {items.map((p, i) => (
        <span key={i}>
          {i > 0 && " · "}
          <Ph text={p.text} isPlaceholder={p.isPlaceholder} />
        </span>
      ))}
    </div>
  );
}

function EntryList({
  list,
  emptyTitle,
  emptySub,
  showDates = true,
}: {
  list: ResumeEntry[];
  emptyTitle: string;
  emptySub: string;
  showDates?: boolean;
}) {
  const rows = list.length ? list : [{ id: "ph", title: "", subtitle: "", start: "", end: "", details: "" }];
  return (
    <>
      {rows.map((e) => {
        const t = previewField(e.title, emptyTitle);
        const s = previewField(e.subtitle, emptySub);
        const d = previewField(e.details, "[Describe impact…]");
        const dates = formatDateRange(e.start, e.end);
        return (
          <div key={e.id} className="mb-2">
            <div className="flex justify-between gap-2">
              <p className="font-semibold">
                <Ph text={t.text} isPlaceholder={t.isPlaceholder} />
              </p>
              {showDates && dates ? <p className="text-slate-500 shrink-0 text-[9px]">{dates}</p> : null}
            </div>
            <p className="text-slate-600">
              <Ph text={s.text} isPlaceholder={s.isPlaceholder} />
            </p>
            {d.text !== "[Describe impact…]" || !d.isPlaceholder ? (
              <p className="whitespace-pre-line text-slate-700">
                <Ph text={d.text} isPlaceholder={d.isPlaceholder} />
              </p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function ResumeExperienceBlock({ data }: { data: ResumeData }) {
  return (
    <Section title="Experience" sectionId="experience">
      <EntryList list={data.internships} emptyTitle="[Role]" emptySub="[Company]" />
    </Section>
  );
}

export function ResumeEducationBlock({ data }: { data: ResumeData }) {
  return (
    <Section title="Education" sectionId="education">
      <EntryList list={data.education} emptyTitle="[School]" emptySub="[Degree]" />
    </Section>
  );
}

export function ResumeProjectsBlock({ data }: { data: ResumeData }) {
  const list = data.projects.length
    ? data.projects
    : [{ id: "ph", name: "", link: "", tech: "", description: "" }];
  return (
    <Section title="Projects" sectionId="projects">
      {list.map((p) => {
        const n = previewField(p.name, "[Project name]");
        const tech = previewField(p.tech, "");
        const desc = previewField(p.description, "[Description]");
        const link = p.link.trim();
        return (
          <div key={p.id} className="mb-2">
            <p className="font-semibold">
              <Ph text={n.text} isPlaceholder={n.isPlaceholder} />
              {link ? <span className="font-normal text-slate-500"> — {link}</span> : null}
            </p>
            {tech.text && !tech.isPlaceholder ? (
              <p className="text-slate-500 text-[9px]">{tech.text}</p>
            ) : null}
            <p className="text-slate-700">
              <Ph text={desc.text} isPlaceholder={desc.isPlaceholder} />
            </p>
          </div>
        );
      })}
    </Section>
  );
}

export function ResumeSkillsBlock({ data, dark, tagClass }: { data: ResumeData; dark?: boolean; tagClass?: string }) {
  const list = data.skills.length ? data.skills : ["[Add skills]"];
  return (
    <Section title="Skills" sectionId="skills">
      <p className="flex flex-wrap gap-1">
        {list.map((s) => (
          <span
            key={s}
            className={
              tagClass ??
              (dark
                ? "rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-100"
                : "rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium")
            }
          >
            {s}
          </span>
        ))}
      </p>
    </Section>
  );
}

export function ResumeLanguagesBlock({ data }: { data: ResumeData }) {
  if (!data.languages.length) return null;
  return (
    <Section title="Languages" sectionId="languages">
      <EntryList list={data.languages} emptyTitle="[Language]" emptySub="[Level]" showDates={false} />
    </Section>
  );
}

export function ResumeCertificationsBlock({ data }: { data: ResumeData }) {
  if (!data.certifications.length) return null;
  return (
    <Section title="Certifications" sectionId="certifications">
      <EntryList list={data.certifications} emptyTitle="[Certification]" emptySub="[Issuer]" showDates={true} />
    </Section>
  );
}

export function ResumeAwardsBlock({ data }: { data: ResumeData }) {
  const awards = previewField(data.awards, "");
  if (!data.awards.trim() && awards.isPlaceholder) return null;
  return (
    <Section title="Awards & Honors" sectionId="awards">
      <p className="whitespace-pre-line">
        <Ph text={awards.text || "[Awards]"} isPlaceholder={!data.awards.trim()} />
      </p>
    </Section>
  );
}

export function ResumeReferencesBlock({ data }: { data: ResumeData }) {
  if (!data.references.length) return null;
  return (
    <Section title="References" sectionId="references">
      <EntryList list={data.references} emptyTitle="[Name]" emptySub="[Title, Company]" showDates={false} />
    </Section>
  );
}

export function ResumeHobbiesBlock({ data }: { data: ResumeData }) {
  if (!data.hobbies.length) return null;
  return (
    <Section title="Interests" sectionId="hobbies">
      <p>{data.hobbies.join(" · ")}</p>
    </Section>
  );
}

export function ResumeSocialBlock({ data }: { data: ResumeData }) {
  const links = [data.social.github, data.social.linkedin, data.social.portfolio].filter(Boolean);
  if (!links.length) return null;
  return (
    <Section title="Links" sectionId="social">
      <p className="text-[10px] text-slate-600">{links.join(" · ")}</p>
    </Section>
  );
}

export function renderSectionBlock(data: ResumeData, sectionId: string): ReactNode | null {
  switch (sectionId) {
    case "header":
      return <ResumeHeaderBlock data={data} />;
    case "summary":
      return <ResumeSummaryBlock data={data} />;
    case "contact":
      return <ResumeContactBlock data={data} />;
    case "experience":
      return <ResumeExperienceBlock data={data} />;
    case "education":
      return <ResumeEducationBlock data={data} />;
    case "skills":
      return <ResumeSkillsBlock data={data} />;
    case "projects":
      return <ResumeProjectsBlock data={data} />;
    case "languages":
      return <ResumeLanguagesBlock data={data} />;
    case "certifications":
      return <ResumeCertificationsBlock data={data} />;
    case "awards":
      return <ResumeAwardsBlock data={data} />;
    case "references":
      return <ResumeReferencesBlock data={data} />;
    case "hobbies":
      return <ResumeHobbiesBlock data={data} />;
    case "social":
      return <ResumeSocialBlock data={data} />;
    default:
      return null;
  }
}

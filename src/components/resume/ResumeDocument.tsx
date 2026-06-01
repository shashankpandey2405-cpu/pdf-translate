import { memo, type ReactNode } from "react";
import type { ResumeData } from "@/tools/resume/types";
import { isSectionVisible } from "@/tools/resume/types";
import { resumeDensityClass } from "@/tools/resume/density";
import { ACCENT_CLASSES, FONT_CLASSES, FONT_STYLE } from "@/tools/resume/designTokens";
import {
  ResumePhoto,
  ResumeHeaderBlock,
  ResumeSummaryBlock,
  ResumeContactBlock,
  ResumeExperienceBlock,
  ResumeEducationBlock,
  ResumeProjectsBlock,
  ResumeSkillsBlock,
  ResumeLanguagesBlock,
  ResumeCertificationsBlock,
  ResumeAwardsBlock,
  ResumeReferencesBlock,
  ResumeHobbiesBlock,
} from "./ResumeBlocks";
import { previewField, previewClass } from "@/tools/resume/previewText";

type Props = { data: ResumeData };

function Ph({ text, isPlaceholder, className = "" }: { text: string; isPlaceholder: boolean; className?: string }) {
  return <span className={previewClass(isPlaceholder, className)}>{text}</span>;
}

function MainSections({ data, skip = [] as string[] }: { data: ResumeData; skip?: string[] }) {
  const blocks: ReactNode[] = [];
  for (const id of data.sectionOrder) {
    if (!isSectionVisible(data, id) || skip.includes(id)) continue;
    if (id === "header") blocks.push(<ResumeHeaderBlock key={id} data={data} />);
    else if (id === "summary") blocks.push(<ResumeSummaryBlock key={id} data={data} />);
    else if (id === "contact") blocks.push(<ResumeContactBlock key={id} data={data} />);
    else if (id === "experience") blocks.push(<ResumeExperienceBlock key={id} data={data} />);
    else if (id === "education") blocks.push(<ResumeEducationBlock key={id} data={data} />);
    else if (id === "skills") blocks.push(<ResumeSkillsBlock key={id} data={data} />);
    else if (id === "projects") blocks.push(<ResumeProjectsBlock key={id} data={data} />);
    else if (id === "languages") blocks.push(<ResumeLanguagesBlock key={id} data={data} />);
    else if (id === "certifications") blocks.push(<ResumeCertificationsBlock key={id} data={data} />);
    else if (id === "awards") blocks.push(<ResumeAwardsBlock key={id} data={data} />);
    else if (id === "references") blocks.push(<ResumeReferencesBlock key={id} data={data} />);
    else if (id === "hobbies") blocks.push(<ResumeHobbiesBlock key={id} data={data} />);
  }
  return <>{blocks}</>;
}

function ResumeDocumentInner({ data }: Props) {
  const density = resumeDensityClass(data);
  const accent = ACCENT_CLASSES[data.design.accentColor];
  const fontClass = FONT_CLASSES[data.design.fontFamily];
  const fontStyle = FONT_STYLE[data.design.fontFamily];
  const hasPhoto = Boolean(data.profilePhoto);
  const id = data.templateId;
  const summary = previewField(data.personal.summary, "[Professional summary…]");
  const page = `bg-white text-slate-900 min-h-[1056px] w-[816px] ${density} ${fontClass}`;
  const style = fontStyle ? { fontFamily: fontStyle } : undefined;

  if (id === "modern-executive" || id === "dubai-corporate") {
    const sidebarCls = id === "dubai-corporate" ? "bg-amber-900" : accent.sidebar;
    return (
      <div className={`${page} flex`} style={style}>
        <aside className={`w-[30%] ${sidebarCls} text-white p-5`}>
          {hasPhoto ? <ResumePhoto data={data} className="h-28 w-28 mx-auto mb-4 border-2 border-white/30" /> : null}
          <ResumeHeaderBlock data={data} nameClass="text-lg" showPhoto={false} light />
          <div className="mt-4">
            <ResumeContactBlock data={data} light />
          </div>
          {isSectionVisible(data, "skills") ? (
            <div className="mt-5">
              <ResumeSkillsBlock data={data} dark />
            </div>
          ) : null}
        </aside>
        <div className="flex-1 p-6">
          {isSectionVisible(data, "summary") ? (
            <p className="mb-4">
              <Ph text={summary.text} isPlaceholder={summary.isPlaceholder} />
            </p>
          ) : null}
          <MainSections data={data} skip={["header", "contact", "summary", "skills"]} />
        </div>
      </div>
    );
  }

  if (id === "creative-portfolio") {
    return (
      <div className={`${page} p-8`} style={{ ...style, background: "linear-gradient(135deg,#f8fafc 0%,#e0e7ff 100%)" }}>
        <div className="flex gap-4 items-start mb-4">
          {hasPhoto ? <ResumePhoto data={data} className="h-20 w-20 shadow-md" /> : null}
          <div className={hasPhoto ? "" : "w-full"}>
            <ResumeHeaderBlock data={data} nameClass="text-3xl text-indigo-900" showPhoto={false} />
            <ResumeContactBlock data={data} />
          </div>
        </div>
        <MainSections data={data} skip={["header", "contact"]} />
      </div>
    );
  }

  if (id === "tech-innovator") {
    return (
      <div className={`${page} p-8 bg-slate-950 text-slate-100`} style={style}>
        <div className="flex gap-4 border-b border-slate-700 pb-4 mb-4">
          {hasPhoto ? <ResumePhoto data={data} className="h-16 w-16 ring-2 ring-cyan-500" /> : null}
          <div>
            <ResumeHeaderBlock data={data} nameClass="text-2xl text-cyan-400" showPhoto={false} light />
            <ResumeContactBlock data={data} light />
          </div>
        </div>
        <MainSections data={data} skip={["header", "contact"]} />
      </div>
    );
  }

  if (id === "minimalist-zen") {
    return (
      <div className={`${page} p-12`} style={style}>
        <ResumeHeaderBlock data={data} nameClass="text-4xl font-light tracking-tight mb-2" showPhoto={false} />
        <ResumeContactBlock data={data} />
        <div className="h-px bg-slate-200 my-6" />
        <MainSections data={data} skip={["header", "contact"]} />
      </div>
    );
  }

  if (id === "standard-professional" || id === "international-eu") {
    return (
      <div className={`${page} p-8 grid grid-cols-[1fr_2fr] gap-6`} style={style}>
        <div>
          {hasPhoto ? <ResumePhoto data={data} className="h-32 w-full mb-4" /> : null}
          <ResumeHeaderBlock data={data} nameClass="text-xl mb-2" showPhoto={false} />
          <ResumeContactBlock data={data} />
          {isSectionVisible(data, "skills") ? (
            <div className="mt-4">
              <ResumeSkillsBlock data={data} />
            </div>
          ) : null}
        </div>
        <div>
          <MainSections data={data} skip={["header", "contact", "skills"]} />
        </div>
      </div>
    );
  }

  if (id === "entrepreneur") {
    return (
      <div className={`${page} p-8`} style={style}>
        <ResumeHeaderBlock data={data} nameClass="text-4xl uppercase tracking-tight mb-1" showPhoto={false} />
        <ResumeContactBlock data={data} />
        <MainSections data={data} skip={["header", "contact"]} />
      </div>
    );
  }

  if (id === "hybrid-flex") {
    const extra = data.additionalInfo.trim() || data.awards.trim();
    return (
      <div className={`${page} p-8 ${extra ? "grid grid-cols-2 gap-6" : ""}`} style={style}>
        <div>
          {hasPhoto ? <ResumePhoto data={data} className="h-20 w-20 mb-3" /> : null}
          <ResumeHeaderBlock data={data} nameClass="text-2xl mb-2" showPhoto={false} />
          <ResumeContactBlock data={data} />
          <MainSections
            data={data}
            skip={["header", "contact", "education", "awards", "skills", "languages", "certifications", "references", "hobbies"]}
          />
        </div>
        {extra ? (
          <div>
            {isSectionVisible(data, "education") ? <ResumeEducationBlock data={data} /> : null}
            {isSectionVisible(data, "awards") ? <ResumeAwardsBlock data={data} /> : null}
            {data.additionalInfo.trim() ? (
              <section data-section-id="additional" className="mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">Additional</h2>
                <p className="whitespace-pre-line">{data.additionalInfo}</p>
              </section>
            ) : null}
            {isSectionVisible(data, "skills") ? <ResumeSkillsBlock data={data} /> : null}
            <MainSections data={data} skip={["header", "contact", "summary", "experience", "education", "skills", "projects", "awards"]} />
          </div>
        ) : (
          isSectionVisible(data, "education") ? <ResumeEducationBlock data={data} /> : null
        )}
      </div>
    );
  }

  if (id === "classic-academic") {
    return (
      <div className={`${page} p-10`} style={style}>
        <header className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <ResumeHeaderBlock data={data} nameClass="text-2xl" showPhoto={false} />
          <ResumeContactBlock data={data} />
        </header>
        {isSectionVisible(data, "summary") ? (
          <p className="mb-5 text-center max-w-xl mx-auto">
            <Ph text={summary.text} isPlaceholder={summary.isPlaceholder} />
          </p>
        ) : null}
        {isSectionVisible(data, "education") ? <ResumeEducationBlock data={data} /> : null}
        <MainSections data={data} skip={["header", "contact", "summary", "education"]} />
      </div>
    );
  }

  if (id === "government-formal") {
    return (
      <div className={`${page} p-10 border-4 border-slate-800`} style={style}>
        <div className="flex gap-6 items-start border-b border-slate-400 pb-4 mb-5">
          {hasPhoto ? <ResumePhoto data={data} className="h-24 w-20 border border-slate-400" /> : null}
          <div className="flex-1">
            <ResumeHeaderBlock data={data} nameClass="text-xl uppercase tracking-wide" showPhoto={false} />
            <ResumeContactBlock data={data} />
          </div>
        </div>
        <MainSections data={data} skip={["header", "contact"]} />
      </div>
    );
  }

  if (id === "international-us") {
    return (
      <div className={`${page} p-10`} style={style}>
        <ResumeHeaderBlock data={data} nameClass="text-xl font-bold" showPhoto={false} />
        <ResumeContactBlock data={data} />
        <div className="h-px bg-slate-300 my-4" />
        <MainSections data={data} skip={["header", "contact"]} />
      </div>
    );
  }

  // ats-friendly, default
  return (
    <div className={`${page} p-8`} style={style}>
      <header className={`border-b-2 ${accent.border} pb-3 mb-4 flex gap-4`}>
        {hasPhoto ? <ResumePhoto data={data} className="h-20 w-20 shrink-0" /> : null}
        <div className={hasPhoto ? "" : "w-full"}>
          <ResumeHeaderBlock data={data} nameClass="text-2xl" showPhoto={false} />
          <ResumeContactBlock data={data} />
        </div>
      </header>
      <MainSections data={data} skip={["header", "contact"]} />
    </div>
  );
}

export const ResumeDocument = memo(ResumeDocumentInner);

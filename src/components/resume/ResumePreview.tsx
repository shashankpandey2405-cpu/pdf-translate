import type { ResumeData } from "@/tools/resume/types";
import { ResumeDocument } from "./ResumeDocument";

type Props = {
  data: ResumeData;
  className?: string;
  exportRootId?: string;
};

export function ResumePreview({ data, className = "", exportRootId = "resume-preview-export" }: Props) {
  return (
    <div
      id={exportRootId}
      className={`shadow-2xl rounded-sm overflow-hidden border border-slate-200 bg-white ${className}`}
    >
      <ResumeDocument data={data} />
    </div>
  );
}

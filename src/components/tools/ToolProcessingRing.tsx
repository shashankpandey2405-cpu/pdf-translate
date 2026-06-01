import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import type { ProcessingStatusType } from "@/lib/processing/processingStatusType";

type Props = {
  progress: number;
  title: string;
  subtitle?: string;
  type?: ProcessingStatusType;
};

export default function ToolProcessingRing({ progress, title, type = "cloud" }: Props) {
  return (
    <ProcessingStatus type={type} progress={progress} label={title} className="py-4" />
  );
}

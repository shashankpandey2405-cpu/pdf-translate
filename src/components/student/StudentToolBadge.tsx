import { GraduationCap } from "lucide-react";

export function StudentToolBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
      <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Built for students — free core tools & private processing
    </div>
  );
}

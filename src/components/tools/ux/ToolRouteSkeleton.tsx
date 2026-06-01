import { ShimmerSkeleton } from "@/components/premium/ShimmerSkeleton";
import { TOOL_DROPZONE_MIN_H } from "@/components/tools/ux/toolUxClasses";

/** Route lazy-load placeholder — stable height to limit CLS. */
export function ToolRouteSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading tool"
    >
      <ShimmerSkeleton className="mb-4 h-8 w-48 max-w-[70%]" />
      <ShimmerSkeleton className={TOOL_DROPZONE_MIN_H} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ShimmerSkeleton className="h-10" />
        <ShimmerSkeleton className="h-10" />
        <ShimmerSkeleton className="h-10" />
      </div>
    </div>
  );
}

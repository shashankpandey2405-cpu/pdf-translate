import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  className?: string;
};

export function ShimmerSkeleton({ className }: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <Skeleton className={cn("h-full w-full min-h-[1rem]", className)} />
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
        aria-hidden
      />
    </div>
  );
}

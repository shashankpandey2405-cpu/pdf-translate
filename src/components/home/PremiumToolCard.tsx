"use client";

import { lazy, Suspense, memo } from "react";
import { PremiumToolCardInner, type PremiumToolCardProps } from "@/components/home/PremiumToolCardCore";

const PremiumToolCardMotion = lazy(() =>
  import("@/components/home/PremiumToolCardMotion").then((m) => ({ default: m.PremiumToolCardMotionShell })),
);

export type { PremiumToolCardProps } from "@/components/home/PremiumToolCardCore";

export const PremiumToolCard = memo(function PremiumToolCard(props: PremiumToolCardProps) {
  const { disableMotion = false, ...rest } = props;
  if (disableMotion) {
    return <PremiumToolCardInner {...rest} />;
  }
  return (
    <Suspense fallback={<PremiumToolCardInner {...rest} />}>
      <PremiumToolCardMotion {...rest} />
    </Suspense>
  );
});

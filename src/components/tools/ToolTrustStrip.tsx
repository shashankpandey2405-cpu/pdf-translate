import { Gauge, Shield, Timer, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TrustShieldBadge } from "@/components/trustShield/TrustShieldBadge";
import { getDeviceBrowserLimits } from "@/lib/limits/deviceAdaptiveLimits";
import { cn } from "@/lib/utils";
import { ToolLimitsPanel } from "@/components/tools/ToolLimitsPanel";

type ToolTrustStripProps = {
  /** Upper bound for the free-tier file size callout (MB). Defaults to this device's browser cap. */
  maxFileMb?: number;
  /** When set, shows browser vs Trusted Cloud limits table for this tool. */
  toolSlug?: string;
  className?: string;
};

export default function ToolTrustStrip({ maxFileMb, toolSlug, className }: ToolTrustStripProps) {
  const { t } = useTranslation();
  const deviceMb = getDeviceBrowserLimits().maxFileMB;
  const sizeMb = maxFileMb ?? deviceMb;
  const items = [
    { Icon: Shield, text: t("toolTrustStrip.ssl") },
    { Icon: UserRound, text: t("toolTrustStrip.noLogin") },
    { Icon: Gauge, text: t("toolTrustStrip.size", { maxMb: sizeMb }) },
    { Icon: Timer, text: t("toolTrustStrip.retention") },
  ];

  return (
    <div
      className={cn("rounded-2xl border border-border/80 bg-muted/25 px-4 py-3 sm:px-5", className)}
      role="region"
      aria-label={t("toolTrustStrip.regionLabel")}
    >
      <TrustShieldBadge className="mb-3" compact />
      <ul className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground sm:text-sm">
        {items.map(({ Icon, text }) => (
          <li key={text} className="flex w-full min-w-0 basis-[min(100%,12rem)] items-start gap-2 sm:basis-[calc(50%-0.75rem)] lg:basis-auto">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="leading-snug text-foreground/90">{text}</span>
          </li>
        ))}
      </ul>
      {toolSlug ? <ToolLimitsPanel toolSlug={toolSlug} /> : null}
    </div>
  );
}

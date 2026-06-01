import { memo, type ReactNode } from "react";
import SecurityBadge from "@/components/SecurityBadge";

type Props = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconClassName: string;
  /** For icon aria-label, e.g. "Compress PDF tool icon" */
  iconLabel?: string;
};

function ToolHeaderInner({ title, subtitle, icon, iconClassName, iconLabel }: Props) {
  return (
    <header className="mb-2 flex items-center gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        role={iconLabel ? "img" : undefined}
        aria-label={iconLabel}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h1 className="display-h1 leading-tight">{title}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
        <SecurityBadge />
      </div>
    </header>
  );
}

export default memo(ToolHeaderInner);

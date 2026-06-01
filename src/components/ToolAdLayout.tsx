import type { ReactNode } from "react";
import {
  ToolWorkspaceLayout,
  type ToolWorkspaceStep,
} from "@/components/tools/ToolWorkspaceLayout";

type ToolAdLayoutProps = {
  /** Main column content (classic) or workspace canvas (workspace layout). */
  main: ReactNode;
  /** Sidebar content: tips (classic) or tool options (workspace). */
  sidebar: ReactNode;
  /** Sticky CTA for workspace layout (bottom of options panel). */
  footer?: ReactNode;
  optionsTitle?: string;
  infoAlert?: ReactNode;
  steps?: ToolWorkspaceStep[];
  /** `workspace` = iLovePDF-style canvas left + options right. */
  layout?: "classic" | "workspace";
  hideAds?: boolean;
  showSidebarAd?: boolean;
  gridClassName?: string;
};

/**
 * Tool page layout: classic ad grid or workspace + options sidebar.
 */
export default function ToolAdLayout({
  main,
  sidebar,
  footer,
  optionsTitle,
  infoAlert,
  steps,
  layout = "classic",
  hideAds = false,
  showSidebarAd = false,
  gridClassName = "grid grid-cols-1 gap-8 lg:grid-cols-4",
}: ToolAdLayoutProps) {
  if (layout === "workspace" && optionsTitle) {
    return (
      <ToolWorkspaceLayout
        workspace={main}
        options={sidebar}
        footer={footer}
        optionsTitle={optionsTitle}
        infoAlert={infoAlert}
        steps={steps}
        hideAds={hideAds}
        showSidebarAd={showSidebarAd}
      />
    );
  }

  return (
    <div className={gridClassName}>
      <div className="min-w-0 lg:col-span-3">
        {main}
      </div>
      <aside className="flex min-w-0 flex-col gap-6 lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
        {sidebar}
      </aside>
    </div>
  );
}

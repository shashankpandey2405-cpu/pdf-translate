"use client";

import ToolSEO from "@/components/ToolSEO";
import { RecentActivityPanel } from "@/components/history/RecentActivityPanel";
import { useTranslation } from "react-i18next";

export default function RecentActivity() {
  const { i18n } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <ToolSEO
        title="Recent Activity"
        description="Re-download files from your locally stored cloud processing history."
        slug="recent"
        lang={i18n.language}
        noIndex
      />
      <RecentActivityPanel />
    </div>
  );
}

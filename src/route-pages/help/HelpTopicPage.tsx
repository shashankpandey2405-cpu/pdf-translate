"use client";

import { Link, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import { HELP_TOPICS } from "@/data/help/helpCenterRegistry";

const TOPIC_COPY: Record<string, { title: string; paragraphs: string[] }> = {
  "getting-started": {
    title: "Getting started with PDFTrusted",
    paragraphs: [
      "Choose a tool from the sidebar or home page, upload your file, configure options, and download the result. Most core tools run in your browser without sign-up.",
      "For OCR, Word conversion, or AI features, sign in when prompted for cloud processing. Files upload over a secure connection and outputs can be deleted from your account.",
    ],
  },
  troubleshooting: {
    title: "Troubleshooting",
    paragraphs: [
      "If a job stays queued, refresh and try again — cloud workers may be busy during peak hours.",
      "Large scans may need OCR or cloud mode instead of browser compression. Check file size limits on the upload screen.",
      "For download issues, use the same browser session and allow pop-ups for pdftrusted.com.",
    ],
  },
  billing: {
    title: "Billing & AI credits",
    paragraphs: [
      "Free tier includes daily cloud limits for advanced tools. Premium and credit packs extend file size, page count, and AI usage.",
      "Receipts and credit history appear in your account after sign-in. Refunds follow our refund policy page.",
    ],
  },
  privacy: {
    title: "Privacy & data handling",
    paragraphs: [
      "Browser tools process locally when possible. Cloud jobs use encrypted storage with automatic expiry for outputs.",
      "Read the privacy center and security pages for full details on retention, subprocessors, and your controls.",
    ],
  },
};

export default function HelpTopicPage() {
  const { i18n } = useTranslation();
  const [, params] = useRoute("/help/:topic");
  const topic = params?.topic ?? "";
  const meta = HELP_TOPICS.find((t) => t.slug === topic);
  const copy = TOPIC_COPY[topic];

  if (!meta || !copy) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-semibold">Topic not found</p>
        <Link href="/help" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Help Center
        </Link>
      </div>
    );
  }

  return (
    <>
      <HelpPageSEO
        title={copy.title}
        description={copy.paragraphs[0] ?? meta.title}
        path={`/help/${topic}`}
        lang={i18n.language}
      />
      <HelpCenterLayout
        title={copy.title}
        subtitle={copy.paragraphs[0] ?? ""}
        breadcrumbs={[
          { label: "Help", href: "/help" },
          { label: meta.title },
        ]}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {copy.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>
        <Link href="/help" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to Help Center
        </Link>
      </HelpCenterLayout>
    </>
  );
}

import type { AuditFinding } from "./documentAuditor";

const ACTION_PATHS: Record<string, string> = {
  unlock: "/unlock-pdf",
  split: "/split-pdf",
  compress: "/compress-pdf",
  repair: "/repair-pdf",
  sign: "/sign-pdf",
  editor: "/pdf-editor",
  protect: "/protect-pdf",
};

export function getAuditActionHref(finding: AuditFinding): string | null {
  if (!finding.action) return null;
  return ACTION_PATHS[finding.action] ?? null;
}

export function getAuditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    unlock: "Unlock PDF",
    split: "Split PDF",
    compress: "Compress PDF",
    repair: "Repair PDF",
    sign: "Sign PDF",
    editor: "PDF Editor",
    protect: "Protect PDF",
  };
  return labels[action] ?? "Open tool";
}

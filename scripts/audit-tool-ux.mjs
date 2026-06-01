#!/usr/bin/env node
/**
 * Static UX compliance scan for tool route pages.
 * Output: reports/tool-ux-audit.json
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TOOLS_DIR = path.join(ROOT, "src", "route-pages", "tools");
const OUT = path.join(ROOT, "reports", "tool-ux-audit.json");

const CHECKS = [
  {
    id: "mobileShell",
    pattern:
      /MobileToolLayout|SinglePdfToolShell|AiSummarizeWorkspace|ChatPdfWorkspace|HybridToolChrome/,
  },
  {
    id: "pageSplit",
    pattern:
      /ToolPageSplit|SinglePdfToolShell|GenericToolDesktopAdapter|AiToolDesktopAdapter|CompressDesktopAdapter|MergePdfDesktopAdapter/,
  },
  { id: "uploadSlot", pattern: /ToolUploadSlot/ },
  { id: "safeDownload", pattern: /safeDownloadBlob/ },
  { id: "workspaceHelp", pattern: /ToolHelpLinks/ },
  { id: "framerMotion", pattern: /framer-motion/ },
  { id: "legacyClickDownload", pattern: /a\.click\(\)/ },
  { id: "processingModal", pattern: /ProcessingModeModal/ },
  { id: "aiDocModal", pattern: /AiDocumentProcessingModal/ },
];

function scanFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const text = fs.readFileSync(filePath, "utf8");
  const hits = {};
  for (const c of CHECKS) {
    hits[c.id] = c.pattern.test(text);
  }
  return { file: rel, ...hits };
}

function main() {
  const files = fs
    .readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => path.join(TOOLS_DIR, f));

  const results = files.map(scanFile);
  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    withMobileShell: results.filter((r) => r.mobileShell).length,
    withPageSplit: results.filter((r) => r.pageSplit).length,
    withWorkspaceHelp: results.filter((r) => r.workspaceHelp).length,
    withFramerMotion: results.filter((r) => r.framerMotion).length,
    withLegacyDownload: results.filter((r) => r.legacyClickDownload).length,
    withAiDocModal: results.filter((r) => r.aiDocModal).length,
  };

  const payload = { summary, results };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log("[audit-tool-ux]", JSON.stringify(summary, null, 2));
  console.log(`Wrote ${OUT}`);
}

main();

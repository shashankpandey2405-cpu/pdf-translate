#!/usr/bin/env node
/**
 * PDFTrusted — focused runtime smoke checklist (manual QA).
 * Tier matrix aligns with worker/lib/uploadPolicy.ts and src/lib/chunkedUpload.ts.
 */

const lines = [
  "=== PDFTrusted — focused runtime smoke pass ===",
  "",
  "Prereq API (pick one):",
  "  A) Run `npm run dev:full` so wrangler dev (port 8787) serves /api/*",
  "     and Vite (port 3000) proxies /api there.",
  "  B) Or run `npm run dev` with VITE_API_PROXY_TARGET=https://pdftrusted.com",
  "     to hit the deployed Worker instead.",
  "",
  "Session & auth (local):",
  "  - Open http://localhost:3000; console should NOT spam JSON errors from /api/session.",
  "  - `Sign in with Google` -> callback http://localhost:3000/api/auth/callback/google",
  "    (proxied to wrangler at :8787, which runs @auth/core).",
  "  - Set VITE_MOCK_PREMIUM=true in .env.local to simulate premium UI without payments.",
  "",
  "Upload tier matrix (use test PDFs):",
  "  1) Under 5 MB:   no R2 staging calls; tool processes in-browser only.",
  "  2) ~10 MB:       presigned PUT to R2 via /api/r2/presign-put; no login required.",
  "  3) ~18 MB:       multipart via /api/multipart/*; must be signed in.",
  "  4) ~35 MB:       multipart; requires pt_premium=1 cookie or mock premium.",
  "",
  "Dedicated tool pages + generic ToolPage:",
  "  - Run merge, split, compress, pdf-editor, sign-pdf, and one generic route",
  "    (e.g. excel-to-pdf) through upload -> process -> download.",
  "",
  "Regression:",
  "  npm run typecheck       (SPA + Worker)",
  "  npm run build           (Vite bundle)",
  "  npx wrangler deploy --dry-run   (Worker bundle size check)",
  "",
  "In-app QA suite (optional): /<lang>/internal-tool-suite",
];

console.log(lines.join("\n"));
process.exit(0);

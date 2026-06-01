#!/usr/bin/env node
/**
 * Smoke-check conversion funnel phases 1–6 wiring (static file presence).
 * Run: node scripts/verify-conversion-phases.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const REQUIRED_FILES = [
  // Phase 1 — copy
  "src/lib/conversion/signInCopy.ts",
  "src/components/auth/SignInWorkspaceModal.tsx",
  // Phase 2 — deferred start
  "src/components/conversion/DeferredStartPanel.tsx",
  "src/components/ai/chat/ChatPdfWorkspace.tsx",
  "src/components/ai/summarize/AiSummarizeWorkspace.tsx",
  "src/route-pages/tools/SmartScanAi.tsx",
  "src/components/processing/CloudOnlyToolChrome.tsx",
  // Phase 3 — exit / lock / idle
  "src/components/ExitIntentPrompt.tsx",
  "src/components/conversion/ResultReadyReveal.tsx",
  "src/components/conversion/GuestIdleToolNudge.tsx",
  // Phase 4 — returning / welcome / analytics
  "src/lib/conversion/guestEngagement.ts",
  "src/components/conversion/ReturningGuestBanner.tsx",
  "src/components/conversion/PostSignupWelcomeModal.tsx",
  "src/components/conversion/ConversionVisitTracker.tsx",
  // Phase 5 — translate / nav / login
  "src/route-pages/tools/TranslatePDF.tsx",
  "src/components/conversion/GuestNavSignInCta.tsx",
  "src/components/conversion/LoginBenefitsStrip.tsx",
  // Phase 6 — question gen / pricing / pdf-to-word cloud
  "src/route-pages/tools/AiQuestionGenerator.tsx",
  "src/route-pages/tools/PDFToWord.tsx",
  "src/components/conversion/PricingGuestBanner.tsx",
];

const APP_WIRES = [
  "ReturningGuestBanner",
  "GuestIdleToolNudge",
  "ExitIntentPrompt",
  "ConversionVisitTracker",
  "PostSignupWelcomeModal",
];

const EN_STRINGS = [
  "conversion.postResult.title",
  "conversion.deferred.titleAi",
  "conversion.resultLock.title",
  "conversion.exitIntent.title",
  "conversion.returning.title",
  "conversion.welcome.title",
  "authWorkspace.benefitLimits",
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

let failed = false;

for (const rel of REQUIRED_FILES) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`✗ missing file: ${rel}`);
    failed = true;
  } else {
    console.log(`✓ ${rel}`);
  }
}

const app = read("src/App.tsx");
for (const wire of APP_WIRES) {
  if (!app.includes(wire)) {
    console.error(`✗ App.tsx missing ${wire}`);
    failed = true;
  } else {
    console.log(`✓ App.tsx wires ${wire}`);
  }
}

const en = JSON.parse(read("src/locales/en.json"));
for (const keyPath of EN_STRINGS) {
  let cur = en;
  for (const part of keyPath.split(".")) {
    cur = cur?.[part];
  }
  if (cur == null || cur === "") {
    console.error(`✗ en.json missing ${keyPath}`);
    failed = true;
  } else {
    console.log(`✓ en.json ${keyPath}`);
  }
}

const deferredUsages = [
  "ChatPdfWorkspace.tsx",
  "AiSummarizeWorkspace.tsx",
  "SmartScanAi.tsx",
  "TranslatePDF.tsx",
  "AiQuestionGenerator.tsx",
];
for (const name of deferredUsages) {
  const hits = REQUIRED_FILES.filter((f) => f.endsWith(name));
  const rel = hits[0];
  if (rel && read(rel).includes("DeferredStartPanel")) {
    console.log(`✓ ${name} uses DeferredStartPanel`);
  } else if (rel) {
    console.error(`✗ ${name} missing DeferredStartPanel`);
    failed = true;
  }
}

if (failed) {
  console.error("\nConversion phase verification FAILED");
  process.exit(1);
}
console.log("\nConversion phase verification PASSED (phases 1–6 static checks)");

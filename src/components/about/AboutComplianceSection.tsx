"use client";

import { Link } from "wouter";
import { Shield, Cookie, FileText, Trash2 } from "lucide-react";
import { openCookiePreferences } from "@/components/consent/CookieConsentBanner";

const CONTROLS = [
  {
    icon: Cookie,
    title: "Cookie & consent choices",
    body: "When advertising or analytics is enabled on our site, you can accept all, reject non-essential, or customize categories. Preferences are stored locally. You can reopen settings from the footer.",
  },
  {
    icon: FileText,
    title: "Transparency documents",
    body: "Published Privacy Policy, Cookie Policy, Terms of Service, Disclaimer, Refund Policy, Security page, and Privacy Center describe how we process files, use cloud workers, and handle account data.",
  },
  {
    icon: Trash2,
    title: "Retention & cloud cleanup",
    body: "Browser-based tools run in your session on your device. Cloud jobs use encrypted uploads with automatic staging and output cleanup per our operational policies—not retained for advertising or model training.",
  },
  {
    icon: Shield,
    title: "Security practices",
    body: "HTTPS transport, access controls on cloud infrastructure, error monitoring with PII scrubbing (Sentry), and optional analytics only when configured and consented.",
  },
] as const;

/** Factual transparency block — no certification or “fully compliant worldwide” claims. */
export function AboutComplianceSection() {
  return (
    <section
      id="privacy-security-compliance"
      className="scroll-mt-24 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-md sm:p-10 dark:border-slate-700/50 dark:bg-slate-900/70"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
        Transparency
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Privacy, Security &amp; Global Compliance
      </h2>
      <p className="mt-4 text-base leading-[1.85] text-slate-500 dark:text-slate-400">
        We design our privacy, consent, security, and data-processing systems with consideration for major
        international privacy and data protection frameworks—including GDPR-style rights in the European Economic
        Area and United Kingdom, California and U.S. state privacy laws, PIPEDA, LGPD, and similar regimes. We do not
        claim regulator certification, legal approval, or universal compliance in every jurisdiction. What follows
        reflects systems we have actually implemented in our product and policies.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {CONTROLS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-2xl border border-slate-200/60 bg-white/60 p-5 dark:border-slate-700/50 dark:bg-slate-900/50"
          >
            <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/privacy-policy" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Privacy Policy
        </Link>
        <Link href="/cookie-policy" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Cookie Policy
        </Link>
        <Link href="/privacy-center" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Privacy Center
        </Link>
        <Link href="/security" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Security
        </Link>
        <button
          type="button"
          onClick={() => openCookiePreferences()}
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Cookie settings
        </button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        For data subject requests (access, correction, deletion where applicable), contact us via the{" "}
        <Link href="/contact" className="text-indigo-600 hover:underline dark:text-indigo-400">
          contact page
        </Link>
        . Automated account deletion is not yet available in-product; we handle requests manually where required by law.
      </p>
    </section>
  );
}

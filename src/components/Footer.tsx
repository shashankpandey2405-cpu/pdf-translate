"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Link, useLocation } from "wouter";
import { isHomePath } from "@/lib/siteRoutes";
import { Globe, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage, type SupportedLanguage } from "@/i18n";
import { LANGUAGES } from "../../constants/tools";
import { getPathLanguage, setStoredLanguage } from "@/lib/localization";
import { openCookiePreferences } from "@/components/consent/CookieConsentBanner";
import { brandLogoNavSrc } from "@/lib/branding";
import { cn } from "@/lib/utils";

/** WCAG 4.5:1+ — slate-600 on light footer, slate-300 on dark footer (avoids slate-400 ≈ #90a1b9 on white). */
const linkClass =
  "inline-flex min-h-[44px] items-center text-sm text-slate-600 transition-colors duration-300 ease-out hover:text-slate-900 whitespace-nowrap dark:text-slate-300 dark:hover:text-white";

const columnTitleClass =
  "mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300";

const footerMutedClass = "text-sm text-slate-600 dark:text-slate-300";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className={columnTitleClass}>{title}</p>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

export default function Footer() {
  const { t, i18n: i18nInstance } = useTranslation();
  const [location] = useLocation();
  const onHome = isHomePath(location);

  const handleLanguageChange = (nextLanguage: SupportedLanguage) => {
    const pathname = window.location.pathname;
    const currentLang = getPathLanguage(pathname);
    const tailPath = currentLang ? pathname.replace(`/${currentLang}`, "") || "/" : pathname || "/";
    setStoredLanguage(nextLanguage);
    void changeAppLanguage(nextLanguage);
    window.location.assign(`/${nextLanguage}${tailPath}${window.location.search}${window.location.hash}`);
  };

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-16 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-3.5">
          <p className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
            {t("footer.privacyStrip")}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/privacy-center"
              className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-white"
            >
              {t("footer.privacyCenter", { defaultValue: "Privacy Center" })}
            </Link>
            <Link
              href="/security"
              className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-white"
            >
              {t("footer.securityPage", { defaultValue: "Security" })}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              <Image
                src={brandLogoNavSrc()}
                alt=""
                width={36}
                height={36}
                sizes="36px"
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-xl object-contain"
              />
              <span>
                PDF<span className="text-indigo-400">Trusted</span>
              </span>
            </Link>
            <p className={cn("max-w-xs leading-relaxed", footerMutedClass)}>
              {t("footer.missionShort", {
                defaultValue:
                  "AI-powered document intelligence with privacy-first, browser-native processing.",
              })}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-500" aria-hidden />
              <label htmlFor="footer-lang" className="sr-only">
                {t("footer.language", { defaultValue: "Language" })}
              </label>
              <select
                id="footer-lang"
                name="language"
                aria-label={t("footer.language", { defaultValue: "Language" })}
                value={i18nInstance.resolvedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="min-h-[44px] min-w-[8rem] rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FooterColumn title={t("footer.pdfTools", { defaultValue: "PDF Tools" })}>
            <li>
              <Link href="/merge-pdf" className={linkClass}>
                {t("tools.merge-pdf.label")}
              </Link>
            </li>
            <li>
              <Link href="/compress-pdf" className={linkClass}>
                {t("tools.compress-pdf.label")}
              </Link>
            </li>
            <li>
              <Link href="/split-pdf" className={linkClass}>
                {t("tools.split-pdf.label")}
              </Link>
            </li>
            <li>
              <Link href="/pdf-to-word" className={linkClass}>
                {t("tools.pdf-to-word.label")}
              </Link>
            </li>
            <li>
              <Link href="/pdf-to-image" className={linkClass}>
                {t("tools.pdf-to-image.label")}
              </Link>
            </li>
            <li>
              <Link href="/all-tools" className={linkClass}>
                {t("footer.allTools", { defaultValue: "All tools" })}
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn title={t("footer.aiPower", { defaultValue: "AI Power" })}>
            <li>
              <Link href="/chat-pdf" className={linkClass}>
                {t("tools.chat-pdf.label", { defaultValue: "AI Chat" })}
              </Link>
            </li>
            <li>
              <Link href="/ai-summarize" className={linkClass}>
                {t("tools.ai-summarize.label", { defaultValue: "AI Summary" })}
              </Link>
            </li>
            <li>
              <Link href="/ocr-pdf" className={linkClass}>
                {t("tools.ocr-pdf.label")}
              </Link>
            </li>
            <li>
              <Link href="/translate-pdf" className={linkClass}>
                {t("tools.translate-pdf.label", { defaultValue: "AI Translator" })}
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn title={t("footer.company", { defaultValue: "Company" })}>
            <li>
              <Link href="/about-us" className={linkClass}>
                {t("layout.aboutLink", { defaultValue: "About Us" })}
              </Link>
            </li>
            <li>
              {onHome ? (
                <span className={cn(linkClass, "cursor-default opacity-80")}>
                  {t("home.master.ctaPremiumBadge", { defaultValue: "Premium — Coming Soon" })}
                </span>
              ) : (
                <Link href="/pricing" className={linkClass}>
                  {t("layout.pricingLink", { defaultValue: "Pricing" })}
                </Link>
              )}
            </li>
            <li>
              <Link href="/compare/adobe-acrobat" className={linkClass}>
                {t("footer.adobeCompare", { defaultValue: "Adobe vs Us" })}
              </Link>
            </li>
            <li>
              <Link href="/compare" className={linkClass}>
                {t("footer.compareHub", { defaultValue: "Compare tools" })}
              </Link>
            </li>
            <li>
              <Link href="/blog" className={linkClass}>
                {t("footer.blog", { defaultValue: "Blog" })}
              </Link>
            </li>
            <li>
              <Link href="/help" className={linkClass}>
                {t("footer.helpCenter", { defaultValue: "Help Center" })}
              </Link>
            </li>
            <li>
              <Link href="/faq" className={linkClass}>
                {t("footer.faq", { defaultValue: "FAQ" })}
              </Link>
            </li>
            <li>
              <Link href="/contact" className={linkClass}>
                {t("contactPage.title", { defaultValue: "Contact" })}
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn title={t("footer.legal", { defaultValue: "Legal" })}>
            <li>
              <Link href="/privacy-policy" className={linkClass}>
                {t("layout.privacyLink", { defaultValue: "Privacy" })}
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" className={linkClass}>
                {t("layout.termsLink", { defaultValue: "Terms" })}
              </Link>
            </li>
            <li>
              <Link href="/cookie-policy" className={linkClass}>
                {t("layout.cookieLink", { defaultValue: "Cookie Policy" })}
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className={linkClass}>
                {t("footer.disclaimerLink", { defaultValue: "Disclaimer" })}
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className={linkClass}>
                {t("footer.refundLink", { defaultValue: "Refund Policy" })}
              </Link>
            </li>
            <li>
              <Link href="/security" className={linkClass}>
                {t("footer.securityLink", { defaultValue: "Security" })}
              </Link>
            </li>
            <li>
              <button
                type="button"
                className={linkClass}
                aria-label={t("consent.cookieSettings", { defaultValue: "Cookie settings" })}
                onClick={() => openCookiePreferences()}
              >
                {t("consent.cookieSettings", { defaultValue: "Cookie settings" })}
              </button>
            </li>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row">
          <p className={footerMutedClass}>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t("footer.secure")} · {t("footer.browserBased")}
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Shield,
  Cpu,
  Trash2,
  Mail,
  MessageCircle,
  Sparkles,
  Lock,
  Code2,
} from "lucide-react";
import { fadeUpTransition } from "@/components/premium/motion";

const viewport = { once: true, margin: "-60px" as const };

const HOW_STEPS = [
  { key: "ingest", icon: Shield },
  { key: "optimize", icon: Cpu },
  { key: "purge", icon: Trash2 },
] as const;

export function FounderStorySections() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-16 sm:space-y-20">
      {/* Meet the Developer */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
        className="flex flex-col gap-8 sm:flex-row sm:items-start"
      >
        <div
          className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 to-white shadow-sm dark:border-slate-700 dark:from-indigo-950/40 dark:to-slate-900 sm:mx-0"
          aria-hidden
        >
          <User className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
            {t("aboutPage.founder.meetLabel", { defaultValue: "Meet the Developer" })}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {t("aboutPage.founder.whyBuiltTitle", {
              defaultValue: "Why I Built PDFTrusted",
            })}
          </h2>
          <p className="mt-5 text-base leading-[1.85] text-slate-500 dark:text-slate-400 sm:text-lg">
            {t("aboutPage.founder.problemStory", {
              defaultValue:
                "I was tired of expensive subscriptions and PDF tools that steal user data by uploading files to their servers. I built PDFTrusted as a solo mission to provide professional-grade, AI-powered PDF tools that process everything locally in YOUR browser. No cloud, no catch, just pure privacy.",
            })}
          </p>
        </div>
      </motion.section>

      {/* Vision Behind */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
      >
        <h2 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t("aboutPage.founder.visionTitle", {
            defaultValue: "The Vision Behind PDFTrusted",
          })}
        </h2>
        <p className="mt-5 text-base leading-[1.85] text-slate-500 dark:text-slate-400 sm:text-lg">
          {t("aboutPage.founder.visionBody", {
            defaultValue:
              "I engineered PDFTrusted with a single goal: to return data sovereignty to the user. In an era where cloud-based tools monetize your private documents, I built a Neural-Native platform that processes files directly in your browser. This isn't just a tool; it's a commitment to a faster, more private internet.",
          })}
        </p>
      </motion.section>

      {/* Personal Mission */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
      >
        <h2 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t("aboutPage.founder.missionHeadline", {
            defaultValue: "A Personal Mission for Privacy and Speed.",
          })}
        </h2>
        <p className="mt-5 text-base leading-[1.85] text-slate-500 dark:text-slate-400 sm:text-lg">
          {t("aboutPage.founder.missionBody", {
            defaultValue:
              "I built PDFTrusted because I was tired of a web where 'free' tools came at the cost of your privacy. Every time you upload a document to a cloud-based server, you lose control. I spent nights engineering a Browser-First architecture so you can process documents with professional AI power—without your files ever leaving your device.",
          })}
        </p>
        <ul className="mt-8 space-y-4">
          {(["human", "transparency", "expertise"] as const).map((key) => (
            <li key={key} className="flex gap-4 rounded-xl border border-slate-200/60 bg-white/60 p-4 dark:border-slate-700/50 dark:bg-slate-900/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                {key === "human" ? (
                  <Sparkles className="h-5 w-5" aria-hidden />
                ) : key === "transparency" ? (
                  <Lock className="h-5 w-5" aria-hidden />
                ) : (
                  <Code2 className="h-5 w-5" aria-hidden />
                )}
              </span>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                {t(`aboutPage.founder.trust.${key}`)}
              </p>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* 90% Compression */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
        className="rounded-3xl border border-slate-200/60 bg-white/80 p-8 backdrop-blur-md sm:p-10 dark:border-slate-700/50 dark:bg-slate-900/70"
      >
        <h2 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t("aboutPage.founder.compressionTitle", {
            defaultValue: "How we achieve up to 90% Compression (Without losing quality).",
          })}
        </h2>
        <p className="mt-5 text-base leading-[1.85] text-slate-500 dark:text-slate-400">
          {t("aboutPage.founder.compressionBody", {
            defaultValue:
              "People ask, 'Is it too good to be true?' Here is the reality: Most tools use generic compression. PDFTrusted uses a proprietary Neural-Optimization algorithm. It identifies redundant data and optimizes font-embedding and image-vectors at a deep level. The result? Files that are up to 90% smaller* but look identical to the original.",
          })}
        </p>
        <p className="mt-3 text-xs text-slate-400">
          {t("aboutPage.founder.compressionDisclaimer", {
            defaultValue: "*Compression ratio depends on the original file's structure and content.",
          })}
        </p>
      </motion.section>

      {/* How It Works */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
      >
        <h2 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {t("aboutPage.founder.howTitle", { defaultValue: "How It Works" })}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {HOW_STEPS.map(({ key, icon: Icon }, i) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 dark:border-slate-700/50 dark:bg-slate-900/60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
                {t("aboutPage.founder.stepLabel", { defaultValue: "Step" })} {i + 1}
              </p>
              <h3 className="mt-2 font-bold text-slate-900 dark:text-white">
                {t(`aboutPage.founder.howSteps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t(`aboutPage.founder.howSteps.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          {t("aboutPage.founder.technicalDisclaimer", {
            defaultValue:
              "Performance metrics are based on internal benchmarks; actual results may vary per user environment.",
          })}
        </p>
      </motion.section>

      {/* Personal Promise */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
        className="rounded-2xl border-2 border-indigo-200/60 bg-indigo-50/50 p-6 sm:p-8 dark:border-indigo-800/40 dark:bg-indigo-950/30"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          {t("aboutPage.founder.promiseLabel", { defaultValue: "Personal Promise" })}
        </p>
        <p className="mt-3 text-base font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-lg">
          {t("aboutPage.founder.promise", {
            defaultValue:
              "My promise to you: Browser tools stay private on your device when possible, Turbo Cloud is optional and auto-purges, and core tools remain free.",
          })}
        </p>
      </motion.section>

      {/* Founder's Note */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
        className="rounded-3xl border border-indigo-200/50 bg-indigo-50/50 p-8 dark:border-indigo-900/40 dark:bg-indigo-950/20 sm:p-10"
      >
        <p className="text-base leading-[1.9] text-slate-600 dark:text-slate-300 sm:text-lg">
          {t("aboutPage.founder.note", {
            defaultValue:
              "Every line of code in PDFTrusted was written with a single goal: to give you Adobe-level power for free. I am not a giant corporation; I am a developer dedicated to making the internet safer and faster for everyone. Thank you for trusting my work.",
          })}
        </p>
        <div className="mt-8 border-t border-indigo-200/60 pt-6 dark:border-indigo-800/40">
          <p className="font-founder-signature text-2xl text-slate-800 dark:text-slate-200 sm:text-3xl">
            {t("aboutPage.founder.signatureScript", { defaultValue: "Founder, PDFTrusted" })}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {t("aboutPage.founder.title", { defaultValue: "Founder & Lead Architect" })}
          </p>
        </div>
      </motion.section>

      {/* Connect */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={fadeUpTransition}
        className="flex flex-col items-center gap-4 border-t border-slate-200/80 pt-10 text-center dark:border-slate-800 sm:flex-row sm:justify-between sm:text-left"
      >
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {t("aboutPage.founder.connectTitle", { defaultValue: "Connect with the Dev" })}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t("aboutPage.founder.connectDesc", {
              defaultValue: "Real person. Real support. Reach out anytime.",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:support@pdftrusted.com?subject=Message%20from%20About%20page"
            className="press-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Mail className="h-4 w-4" aria-hidden />
            {t("aboutPage.founder.emailCta", { defaultValue: "Email support" })}
          </a>
          <Link
            href="/contact"
            className="press-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t("aboutPage.founder.contactCta", { defaultValue: "Contact form" })}
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

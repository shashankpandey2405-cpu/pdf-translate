"use client";

import dynamic from "next/dynamic";
import ToolSEO from "@/components/ToolSEO";
import { useTranslation } from "react-i18next";
import { LazyWhenVisible } from "@/components/layout/LazyWhenVisible";
import { HomeSectionSkeleton } from "@/components/home/HomePageSkeleton";
const HomeMasterHero = dynamic(
  () => import("@/components/home/HomeMasterHero").then((m) => ({ default: m.HomeMasterHero })),
  { ssr: false },
);

const HomeTrustStrip = dynamic(
  () => import("@/components/home/HomeTrustStrip").then((m) => ({ default: m.HomeTrustStrip })),
  { loading: () => <HomeSectionSkeleton className="min-h-[160px]" /> },
);

const HomeTrustFaq = dynamic(
  () => import("@/components/home/HomeTrustFaq").then((m) => ({ default: m.HomeTrustFaq })),
  { loading: () => <HomeSectionSkeleton className="min-h-[280px]" /> },
);

const HomeExploreMore = dynamic(
  () => import("@/components/home/HomeExploreMore").then((m) => ({ default: m.HomeExploreMore })),
  { loading: () => <HomeSectionSkeleton className="min-h-[80px]" /> },
);

/** Lighthouse-optimized home: static above-fold hero + lazy below-fold only. */
export default function Home() {
  const { t, i18n: i18nInstance } = useTranslation();

  return (
    <>
      <ToolSEO
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        slug=""
        lang={i18nInstance.language}
      />

      <HomeMasterHero />

      <div className="home-below-fold min-w-0 overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20">
        <LazyWhenVisible
          minHeight="160px"
          fallback={<HomeSectionSkeleton className="min-h-[160px]" />}
        >
          <HomeTrustStrip />
        </LazyWhenVisible>
        <LazyWhenVisible
          minHeight="320px"
          fallback={<HomeSectionSkeleton className="min-h-[280px]" />}
        >
          <HomeTrustFaq />
        </LazyWhenVisible>
        <LazyWhenVisible minHeight="80px">
          <HomeExploreMore />
        </LazyWhenVisible>
      </div>
    </>
  );
}

import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LEARN_TOPICS, PILOT_GUIDE_SLUGS, HELP_TOPICS, guidePathForSlug, faqPathForSlug, getGuideBundle, toolDisplayNameFromBundle } from "@/data/help/helpCenterRegistry";

export default function FAQ() {
  const { t } = useTranslation();
  const items = [
    { question: t("faqPage.items.freeQ"), answer: t("faqPage.items.freeA") },
    { question: t("faqPage.items.loginQ"), answer: t("faqPage.items.loginA") },
    { question: t("faqPage.items.sizeQ"), answer: t("faqPage.items.sizeA") },
    { question: t("faqPage.items.storageQ"), answer: t("faqPage.items.storageA") },
    { question: t("faqPage.items.adsQ"), answer: t("faqPage.items.adsA") },
    { question: t("faqPage.items.mobileQ"), answer: t("faqPage.items.mobileA") },
  ];

  const popularToolFaqs = PILOT_GUIDE_SLUGS.map((slug) => {
    const bundle = getGuideBundle(slug);
    return {
      slug,
      name: toolDisplayNameFromBundle(slug, bundle),
      href: faqPathForSlug(slug),
    };
  });

  return (
    <InformationLayout title={t("faqPage.title")} subtitle={t("faqPage.subtitle")}>
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm leading-7 text-muted-foreground">{t("faqPage.intro")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/help" className="rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
            Help Center
          </Link>
          <Link href="/guides" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Tool guides
          </Link>
          <Link href="/learn" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Learn
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Help topics</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {HELP_TOPICS.map((topic) => (
            <li key={topic.slug}>
              <Link href={topic.href} className="block rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-primary/40">
                {topic.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Tool FAQs</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {popularToolFaqs.map((item) => (
            <li key={item.slug}>
              <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                {item.name} FAQ
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/guides" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          All tool guides →
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground">Platform</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {LEARN_TOPICS.slice(0, 4).map((topic) => (
            <li key={topic.slug}>
              <Link href={topic.href} className="text-sm font-medium text-primary hover:underline">
                {topic.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <FAQSection items={items} />
      </div>
    </InformationLayout>
  );
}

import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { brandLogoSrc } from "@/lib/branding";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginBenefitsStrip } from "@/components/conversion/LoginBenefitsStrip";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PRICING_PATH } from "@/lib/billing/upgradeFlow";

export default function Login() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isSignedIn, isLoading } = useAuthSession();

  useEffect(() => {
    if (isLoading || !isSignedIn) return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || params.get("return");
    navigate(next && next.startsWith("/") ? next : PRICING_PATH);
  }, [isLoading, isSignedIn, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("error") && !params.has("code")) return;

    const err = params.get("error");
    const code = params.get("code");
    if (err) {
      const description = code ? `${err} (${code})` : err;
      toast.error(t("loginPage.oauthErrorTitle"), { description });
    }

    const next = new URL(window.location.href);
    next.searchParams.delete("error");
    next.searchParams.delete("code");
    window.history.replaceState({}, "", `${next.pathname}${next.search}${next.hash}`);
  }, [t]);

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] overflow-hidden px-4 py-12 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.25), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, hsl(var(--primary) / 0.08), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 80%, hsl(var(--muted) / 0.4), transparent 45%)",
        }}
      />

      <Helmet>
        <title>{t("loginPage.metaTitle")}</title>
        <meta name="description" content={t("loginPage.metaDesc")} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="relative mx-auto max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 flex flex-col items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <img src={brandLogoSrc()} alt="PDFTrusted Logo" className="h-10 w-10 object-contain" width={40} height={40} />
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("loginPage.heroTitle")}
          </h1>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {t("loginPage.heroSubtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
        >
          {!isSignedIn ? <LoginBenefitsStrip /> : null}
          <AuthCard />
        </motion.div>
      </div>
    </div>
  );
}

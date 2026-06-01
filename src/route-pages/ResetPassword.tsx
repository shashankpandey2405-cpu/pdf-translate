import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { notifySessionChanged } from "@/lib/authSession";

export default function ResetPassword() {
  const { t, i18n } = useTranslation();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [legacyToken, setLegacyToken] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (isSupabaseConfigured() && accessToken && type === "recovery") {
      setRecoveryReady(true);
      return;
    }

    const search = new URLSearchParams(window.location.search);
    setLegacyToken(search.get("token") ?? "");
  }, []);

  const schema = z
    .object({
      password: z
        .string()
        .min(8, { message: t("loginPage.validation.passwordMin") })
        .max(128, { message: t("loginPage.validation.passwordMax") })
        .regex(/[A-Za-z]/, { message: t("loginPage.validation.passwordLetter") })
        .regex(/[0-9]/, { message: t("loginPage.validation.passwordNumber") }),
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
      path: ["confirm"],
      message: t("loginPage.validation.passwordMismatch"),
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    if (recoveryReady && isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        toast.error(t("loginPage.errors.apiUnreachable"));
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        toast.error(error.message || t("loginPage.errors.generic"));
        return;
      }
      notifySessionChanged();
      toast.success(t("loginPage.resetSuccess"));
      form.reset();
      window.history.replaceState({}, "", window.location.pathname);
      window.location.assign(`/${i18n.language}/login`);
      return;
    }

    if (!legacyToken) {
      toast.error(t("loginPage.resetMissingToken"));
      return;
    }
    const res = await fetch("/api/account-reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token: legacyToken, password: data.password }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(body.error || t("loginPage.errors.generic"));
      return;
    }
    toast.success(t("loginPage.resetSuccess"));
    form.reset();
    window.location.assign(`/${i18n.language}/login`);
  });

  const hasToken = recoveryReady || Boolean(legacyToken);

  return (
    <motion.div className="mx-auto max-w-[420px] px-4 py-16 sm:py-24">
      <Helmet>
        <title>{t("loginPage.resetMetaTitle")}</title>
        <meta name="description" content={t("loginPage.resetMetaDesc")} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="rounded-[1.35rem] border border-border/80 bg-card/80 p-8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("loginPage.resetTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("loginPage.resetSubtitle")}</p>

        {!hasToken ? (
          <p className="mt-6 text-sm text-destructive">{t("loginPage.resetMissingToken")}</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("loginPage.passwordLabel")}</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("loginPage.confirmPasswordLabel")}</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("loginPage.resetSubmit")
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("loginPage.backToSignIn")}
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  assertAuthApiReachable,
  requestPasswordReset,
  signInWithCredentials,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/authClient";
import { isAuthEnabled } from "@/lib/featureFlags";

type AuthMode = "signin" | "signup" | "forgot";

function buildSignInSchema(t: (k: string) => string) {
  return z.object({
    email: z.string().trim().email({ message: t("loginPage.validation.emailInvalid") }),
    password: z.string().min(1, { message: t("loginPage.validation.passwordRequired") }),
  });
}

function buildSignUpSchema(t: (k: string) => string) {
  const pwd = z
    .string()
    .min(8, { message: t("loginPage.validation.passwordMin") })
    .max(128, { message: t("loginPage.validation.passwordMax") })
    .regex(/[A-Za-z]/, { message: t("loginPage.validation.passwordLetter") })
    .regex(/[0-9]/, { message: t("loginPage.validation.passwordNumber") });
  return z
    .object({
      name: z.string().max(80).optional(),
      email: z.string().trim().email({ message: t("loginPage.validation.emailInvalid") }),
      password: pwd,
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
      path: ["confirm"],
      message: t("loginPage.validation.passwordMismatch"),
    });
}

function buildForgotSchema(t: (k: string) => string) {
  return z.object({
    email: z.string().trim().email({ message: t("loginPage.validation.emailInvalid") }),
  });
}

export function AuthCard() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [browserOrigin, setBrowserOrigin] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrowserOrigin(window.location.origin);
  }, []);

  const postLoginPath = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search;
    }
    return `/${i18n.language}/all-tools`;
  }, [i18n.language]);

  const callbackUrl = useMemo(() => {
    if (!browserOrigin) return postLoginPath;
    return `${browserOrigin}${postLoginPath}`;
  }, [browserOrigin, postLoginPath]);

  const signInForm = useForm<z.infer<ReturnType<typeof buildSignInSchema>>>({
    resolver: zodResolver(buildSignInSchema(t)),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<ReturnType<typeof buildSignUpSchema>>>({
    resolver: zodResolver(buildSignUpSchema(t)),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  const forgotForm = useForm<z.infer<ReturnType<typeof buildForgotSchema>>>({
    resolver: zodResolver(buildForgotSchema(t)),
    defaultValues: { email: "" },
  });

  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    try {
      const probe = await assertAuthApiReachable();
      if (!probe.ok) {
        toast.error(t(probe.i18nKey), probe.detail ? { description: probe.detail } : undefined);
        return;
      }
      const result = await signInWithGoogle(postLoginPath);
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  const onSignIn = signInForm.handleSubmit(async (data) => {
    setBusy(true);
    try {
      const result = await signInWithCredentials(data.email, data.password, callbackUrl);
      if (!result.ok) {
        toast.error(result.error);
      }
    } finally {
      setBusy(false);
    }
  });

  const onSignUp = signUpForm.handleSubmit(async (data) => {
    setBusy(true);
    try {
      const result = await signUpWithEmail(
        data.email,
        data.password,
        data.name?.trim() || undefined,
      );
      if (!result.ok) {
        toast.error(result.error || t("loginPage.errors.generic"));
        return;
      }
      if (result.needsEmailConfirmation) {
        toast.message(t("auth.supabaseConfirmEmail", { defaultValue: "Check your email" }), {
          description: t("auth.supabaseConfirmEmailDesc", {
            defaultValue: "We sent a confirmation link. Sign in after verifying your email.",
          }),
        });
        setMode("signin");
        signInForm.setValue("email", data.email);
        signUpForm.reset();
        return;
      }
      toast.success(t("loginPage.signUpSuccess"));
      window.location.assign(callbackUrl);
    } finally {
      setBusy(false);
    }
  });

  const onForgot = forgotForm.handleSubmit(async (data) => {
    setBusy(true);
    try {
      const result = await requestPasswordReset(data.email);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.message(t("loginPage.forgotToastTitle"), {
        description: t("loginPage.forgotToastDesc"),
      });
      setMode("signin");
    } finally {
      setBusy(false);
    }
  });

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/80 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="border-b border-border/60 bg-muted/30 px-6 pt-6 pb-2">
          {mode === "forgot" ? (
            <div className="pb-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("loginPage.backToSignIn")}
              </button>
            </div>
          ) : (
            <div className="flex rounded-2xl bg-muted/50 p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "relative flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200",
                    mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground/90",
                  )}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="authTab"
                      className="absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-border/60"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">
                    {m === "signin" ? t("loginPage.tabSignIn") : t("loginPage.tabSignUp")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-8 pt-6">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "forgot" ? (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                onSubmit={onForgot}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("loginPage.forgotTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("loginPage.forgotSubtitle")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">{t("loginPage.emailLabel")}</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("loginPage.emailPlaceholder")}
                    className="h-11 rounded-xl border-border/80 bg-background/80"
                    {...forgotForm.register("email")}
                  />
                  {forgotForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl text-[15px] font-semibold" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("loginPage.forgotSubmit")}
                </Button>
              </motion.form>
            ) : mode === "signup" ? (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                onSubmit={onSignUp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="su-name">{t("loginPage.nameLabel")}</Label>
                  <Input
                    id="su-name"
                    autoComplete="name"
                    placeholder={t("loginPage.namePlaceholder")}
                    className="h-11 rounded-xl border-border/80 bg-background/80"
                    {...signUpForm.register("name")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">{t("loginPage.emailLabel")}</Label>
                  <Input
                    id="su-email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("loginPage.emailPlaceholder")}
                    className="h-11 rounded-xl border-border/80 bg-background/80"
                    {...signUpForm.register("email")}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">{t("loginPage.passwordLabel")}</Label>
                  <Input
                    id="su-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("loginPage.passwordPlaceholder")}
                    className="h-11 rounded-xl border-border/80 bg-background/80"
                    {...signUpForm.register("password")}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-confirm">{t("loginPage.confirmPasswordLabel")}</Label>
                  <Input
                    id="su-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("loginPage.confirmPasswordPlaceholder")}
                    className="h-11 rounded-xl border-border/80 bg-background/80"
                    {...signUpForm.register("confirm")}
                  />
                  {signUpForm.formState.errors.confirm && (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.confirm.message}</p>
                  )}
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl text-[15px] font-semibold" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("loginPage.signUpCta")}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="signin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                {isAuthEnabled() && (
                  <>
                    <button
                      type="button"
                      disabled={googleBusy}
                      onClick={() => void handleGoogleSignIn()}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background text-[15px] font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {googleBusy ? (
                        <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                      ) : (
                        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      {t("loginPage.googleCta")}
                    </button>

                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/70" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase tracking-wide">
                        <span className="bg-card px-3 text-muted-foreground">{t("loginPage.orEmail")}</span>
                      </div>
                    </div>
                  </>
                )}

                <form onSubmit={onSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">{t("loginPage.emailLabel")}</Label>
                    <Input
                      id="si-email"
                      type="email"
                      autoComplete="email"
                      placeholder={t("loginPage.emailPlaceholder")}
                      className="h-11 rounded-xl border-border/80 bg-background/80"
                      {...signInForm.register("email")}
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="si-password">{t("loginPage.passwordLabel")}</Label>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => {
                          setMode("forgot");
                          const e = signInForm.getValues("email");
                          if (e) forgotForm.setValue("email", e);
                        }}
                      >
                        {t("loginPage.forgotLink")}
                      </button>
                    </div>
                    <Input
                      id="si-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder={t("loginPage.passwordPlaceholder")}
                      className="h-11 rounded-xl border-border/80 bg-background/80"
                      {...signInForm.register("password")}
                    />
                    {signInForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-xl text-[15px] font-semibold" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("loginPage.signInCta")}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {mode !== "forgot" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  {t("loginPage.noAccount")}{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    {t("loginPage.switchToSignUp")}
                  </button>
                </>
              ) : (
                <>
                  {t("loginPage.haveAccount")}{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    {t("loginPage.switchToSignIn")}
                  </button>
                </>
              )}
            </p>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground/90">
            {t("loginPage.legalPrefix")}{" "}
            <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
              {t("loginPage.terms")}
            </Link>{" "}
            {t("loginPage.legalAnd")}{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
              {t("loginPage.privacy")}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

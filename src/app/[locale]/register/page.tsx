"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Brain,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

type AccountType = "student" | "tutor" | "both";

const inputClassName =
  "h-14 rounded-md border-0 bg-surface-container-highest px-5 text-lumina-body-lg text-on-surface shadow-none placeholder:text-outline transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 md:px-6";

const roleOptions: {
  value: AccountType;
  icon: typeof GraduationCap;
}[] = [
  { value: "student", icon: GraduationCap },
  { value: "tutor", icon: Brain },
  { value: "both", icon: Users },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registrationState, setRegistrationState] = useState<
    "idle" | "email_confirmation_required"
  >("idle");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle"
  );
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("register");
  const tLogin = useTranslations("login");
  const supabase = createClient();
  const year = new Date().getFullYear();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (!validateEmail(newEmail) && newEmail.length > 0) {
      setEmailError(t("invalidEmail"));
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);
    setRegistrationState("idle");

    if (!validateEmail(email)) {
      setEmailError(t("invalidEmail"));
      return;
    }

    try {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/${locale}/auth/callback`
          : undefined;
      const result = await register(email, password, accountType, {
        emailRedirectTo,
      });

      if (result === "email_confirmation_required") {
        setRegistrationState("email_confirmation_required");
        return;
      }

      if (accountType === "both") {
        router.push(`/${locale}/dashboard`);
      } else if (accountType === "tutor") {
        router.push(`/${locale}/teacher-profile`);
      } else {
        router.push(`/${locale}/student-profile`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("registrationFailed");
      setRegisterError(message || t("registrationFailed"));
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setResendState("sending");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setResendState("sent");
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : t("resendFailed"));
      setResendState("idle");
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  const shellClass =
    "relative flex min-h-[100dvh] flex-col items-center overflow-x-hidden bg-surface px-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] font-sans max-md:justify-start max-md:pt-6 sm:px-5 md:justify-center md:px-10 md:py-12 lg:px-8 [background-image:radial-gradient(at_0%_0%,hsla(263,74%,85%,1)_0,transparent_50%),radial-gradient(at_100%_100%,hsla(263,74%,92%,1)_0,transparent_50%)] dark:bg-surface-dim dark:[background-image:radial-gradient(at_0%_0%,rgba(167,139,250,0.14)_0,transparent_45%),radial-gradient(at_100%_100%,rgba(112,42,225,0.1)_0,transparent_50%)]";

  const formCardClass =
    "rounded-2xl bg-surface-container-lowest/85 p-6 shadow-lumina-sm ring-1 ring-outline-variant/10 backdrop-blur-2xl dark:bg-surface-container-lowest/75 sm:p-7 md:rounded-xl md:bg-surface-container-lowest/80 md:p-10 md:shadow-lumina-lg lg:p-12 lg:shadow-[0_30px_60px_-15px_rgba(112,42,225,0.08)]";

  if (registrationState === "email_confirmation_required") {
    return (
      <div className={shellClass}>
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden md:hidden"
          aria-hidden
        >
          <div className="absolute -right-8 top-[12%] h-48 w-48 rounded-full bg-primary-container/20 blur-3xl dark:bg-primary/12" />
          <div className="absolute -left-10 bottom-[30%] h-56 w-56 rounded-full bg-secondary-container/15 blur-3xl dark:bg-secondary/8" />
        </div>
        <main className="relative z-10 w-full max-w-[480px] space-y-7 pb-6 md:max-w-[540px] md:space-y-11 md:pb-36 lg:max-w-[480px] lg:space-y-12 lg:pb-28">
          <div className={formCardClass}>
            <div className="space-y-2 text-center">
              <h1 className="font-headline text-xl font-extrabold text-on-background md:text-2xl">
                {t("checkEmail.title")}
              </h1>
              <p className="text-lumina-body text-on-surface-variant">
                {t("checkEmail.description", { email })}
              </p>
            </div>
            <div className="mt-8 space-y-4">
              {registerError ? (
                <Alert className="border border-error/25 bg-error-container/15 text-on-error-container">
                  <AlertDescription className="text-on-error-container">
                    {registerError}
                  </AlertDescription>
                </Alert>
              ) : null}
              <button
                type="button"
                className="h-12 w-full rounded-full bg-gradient-to-br from-primary to-primary-dim font-headline text-lumina-button font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:h-14"
                onClick={handleResendConfirmation}
                disabled={resendState === "sending"}
              >
                {resendState === "sending"
                  ? t("checkEmail.resending")
                  : resendState === "sent"
                    ? t("checkEmail.resent")
                    : t("checkEmail.resend")}
              </button>
              <button
                type="button"
                className="h-12 w-full rounded-full border border-outline-variant/40 font-headline text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high/50"
                onClick={() => router.push(`/${locale}/login`)}
              >
                {t("checkEmail.goToLogin")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden md:hidden"
        aria-hidden
      >
        <div className="absolute -right-8 top-[12%] h-48 w-48 rounded-full bg-primary-container/20 blur-3xl dark:bg-primary/12" />
        <div className="absolute -left-10 bottom-[30%] h-56 w-56 rounded-full bg-secondary-container/15 blur-3xl dark:bg-secondary/8" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
        aria-hidden
      >
        <div className="absolute -left-16 top-[18%] h-64 w-64 rounded-full bg-primary-container/25 blur-3xl lg:h-72 lg:w-72 dark:bg-primary/15" />
        <div className="absolute -right-20 bottom-[22%] h-72 w-72 rounded-full bg-secondary-container/25 blur-3xl lg:-right-12 lg:bottom-[25%] dark:bg-secondary/10" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl lg:hidden dark:bg-primary/10" />
      </div>

      <main className="relative z-10 w-full max-w-4xl pb-6 md:pb-36 lg:pb-28">
        {/* Mobile header (Stitch registro_mobile) */}
        <div className="mb-8 flex max-w-md flex-col md:mx-auto lg:mb-0 lg:max-w-none">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link
              href={`/${locale}/login`}
              className="flex size-12 items-center justify-center rounded-full bg-surface-container-highest/50 text-on-surface transition-colors hover:bg-surface-container-highest"
              aria-label={t("lumina.backAria")}
            >
              <ArrowLeft className="size-5" strokeWidth={2} />
            </Link>
            <span className="rounded-full bg-surface-container-highest px-4 py-1.5 font-headline text-xs font-semibold uppercase tracking-wider text-primary">
              {t("lumina.stepLabel")}
            </span>
          </div>

          <div className="mb-6 space-y-3 lg:hidden">
            <h1 className="font-headline text-[1.75rem] font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl">
              {t.rich("lumina.mobileHeadline", {
                accent: (chunks) => (
                  <span className="text-primary">{chunks}</span>
                ),
              })}
            </h1>
            <p className="text-lg font-medium leading-relaxed text-on-surface-variant">
              {t("lumina.mobileSubtitle")}
            </p>
          </div>

          <div
            className="mb-8 flex gap-2 lg:hidden"
            role="presentation"
            aria-hidden
          >
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-surface-container-high" />
            <div className="h-1.5 flex-1 rounded-full bg-surface-container-high" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Editorial column — Tablet: stacked above form (md–lg) */}
          <div className="hidden max-w-[540px] space-y-6 md:mx-auto md:block lg:hidden">
            <div className="space-y-3 md:space-y-4">
              <span className="inline-block rounded-full bg-primary-container px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-widest text-on-primary-container">
                {t("lumina.badge")}
              </span>
              <h1 className="font-headline text-2xl font-extrabold leading-[1.15] tracking-tighter text-on-background md:text-3xl xl:text-5xl">
                {t.rich("lumina.headline", {
                  accent: (chunks) => (
                    <span className="text-primary">{chunks}</span>
                  ),
                })}
              </h1>
              <p className="max-w-md text-base leading-relaxed text-on-surface-variant md:text-lg">
                {t("lumina.editorial")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2 rounded-lg bg-surface-container-low p-4 md:p-6">
                <Star
                  className="size-6 text-primary md:size-8"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="font-headline text-sm font-bold text-on-background">
                  {t("lumina.featureMentors")}
                </p>
              </div>
              <div className="space-y-2 rounded-lg bg-surface-container-highest p-4 md:p-6">
                <Sparkles
                  className="size-6 text-primary md:size-8"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="font-headline text-sm font-bold text-on-background">
                  {t("lumina.featureFlexible")}
                </p>
              </div>
            </div>
          </div>

          {/* Editorial column — Desktop only: side-by-side (lg+) */}
          <div className="hidden space-y-8 lg:col-span-5 lg:block">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-primary-container px-4 py-1.5 font-headline text-xs font-bold uppercase tracking-widest text-on-primary-container">
                {t("lumina.badge")}
              </span>
              <h1 className="font-headline text-4xl font-extrabold leading-[1.1] tracking-tighter text-on-background xl:text-5xl">
                {t.rich("lumina.headline", {
                  accent: (chunks) => (
                    <span className="text-primary">{chunks}</span>
                  ),
                })}
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-on-surface-variant">
                {t("lumina.editorial")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 rounded-lg bg-surface-container-low p-6">
                <Star
                  className="size-8 text-primary"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="font-headline text-sm font-bold text-on-background">
                  {t("lumina.featureMentors")}
                </p>
              </div>
              <div className="space-y-2 rounded-lg bg-surface-container-highest p-6">
                <Sparkles
                  className="size-8 text-primary"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="font-headline text-sm font-bold text-on-background">
                  {t("lumina.featureFlexible")}
                </p>
              </div>
            </div>
          </div>

          <div className="md:mx-auto md:max-w-[540px] lg:mx-0 lg:max-w-none lg:col-span-7">
            <div className={cn(formCardClass, "max-md:mx-auto max-md:max-w-md")}>
              <div className="mb-8 hidden items-center gap-4 md:flex">
                <div className="h-1.5 flex-1 rounded-full bg-primary" />
                <div className="h-1.5 flex-1 rounded-full bg-surface-container-high" />
                <div className="whitespace-nowrap font-headline text-xs font-bold uppercase tracking-widest text-primary">
                  {t("lumina.stepLabel")}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <h2 className="font-headline text-xl font-bold text-on-background md:text-2xl">
                    {t("lumina.whoAreYou")}
                  </h2>
                  <div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    role="radiogroup"
                    aria-label={t("accountType")}
                  >
                    {roleOptions.map(({ value, icon: Icon }) => {
                      const selected = accountType === value;
                      const roleDesc =
                        value === "student"
                          ? t("lumina.roleStudentDesc")
                          : value === "tutor"
                            ? t("lumina.roleTutorDesc")
                            : t("lumina.roleBothDesc");
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setAccountType(value)}
                          className={cn(
                            "rounded-lg border-2 p-6 text-left transition-all duration-300",
                            "bg-surface-container-low hover:bg-surface-container-high/40",
                            selected
                              ? "border-primary bg-surface-container-lowest shadow-sm dark:bg-surface-container-lowest/90"
                              : "border-transparent"
                          )}
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <Icon
                              className="size-8 text-primary"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full border-2 border-outline-variant",
                                selected && "border-primary"
                              )}
                              aria-hidden
                            >
                              <span
                                className={cn(
                                  "size-2.5 rounded-full bg-primary transition-transform",
                                  selected ? "scale-100" : "scale-0"
                                )}
                              />
                            </span>
                          </div>
                          <p className="font-headline font-bold text-on-background">
                            {t(value)}
                          </p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {roleDesc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="ml-1 font-headline text-xs font-bold uppercase tracking-widest text-on-surface"
                    >
                      {t("email")}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t("input.email")}
                      value={email}
                      onChange={handleEmailChange}
                      required
                      className={cn(
                        inputClassName,
                        emailError ? "ring-2 ring-error/40" : ""
                      )}
                    />
                    {emailError ? (
                      <p className="text-sm text-error">{emailError}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="ml-1 font-headline text-xs font-bold uppercase tracking-widest text-on-surface"
                    >
                      {t("password")}
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder={t("input.password")}
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        className={`${inputClassName} pr-14`}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? tLogin("hidePassword")
                            : tLogin("showPassword")
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-5" strokeWidth={2} />
                        ) : (
                          <Eye className="size-5" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {registerError ? (
                  <Alert className="border border-error/25 bg-error-container/15 text-on-error-container">
                    <AlertDescription className="text-on-error-container">
                      {registerError}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-center md:justify-between">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-full bg-gradient-to-br from-primary to-primary-dim px-8 font-headline text-lumina-button font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:h-14 md:w-auto md:min-w-[200px]"
                  >
                    {isLoading ? t("loading") : t("lumina.submitCta")}
                  </button>
                  <p className="text-center text-sm text-on-surface-variant md:text-left">
                    {t("alreadyHaveAccount")}{" "}
                    <Link
                      href={`/${locale}/login`}
                      className="font-bold text-primary underline-offset-4 hover:underline"
                    >
                      {t("login")}
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            <div className="mx-auto mt-8 flex max-w-md items-center gap-4 px-2 lg:max-w-none">
              <div className="h-px flex-1 bg-outline-variant/30" />
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                {t("lumina.secureBadge")}
              </span>
              <div className="h-px flex-1 bg-outline-variant/30" />
            </div>
          </div>
        </div>

        {/* Mobile: máscara blur inferior (estilo Stitch registro_mobile) */}
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent md:hidden"
          aria-hidden
        />

        <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-4 border-t border-outline-variant/15 pt-6 md:hidden">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href={`/${locale}/contact`}
              className="font-headline text-[0.6875rem] font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
            >
              {tLogin("helpCenter")}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="font-headline text-[0.6875rem] font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
            >
              {tLogin("privacy")}
            </Link>
          </div>
          <p className="text-center font-headline text-[0.6875rem] font-bold uppercase tracking-overline text-outline/90">
            {tLogin("copyright", { year })}
          </p>
        </div>
      </main>

      <footer className="pointer-events-none fixed bottom-6 left-0 hidden w-full items-center justify-between px-8 md:flex md:px-10 lg:bottom-8 lg:px-12">
        <p className="pointer-events-auto font-headline text-xs font-bold uppercase tracking-overline text-outline">
          {tLogin("copyright", { year })}
        </p>
        <div className="pointer-events-auto flex gap-8">
          <Link
            href={`/${locale}/contact`}
            className="font-headline text-xs font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
          >
            {tLogin("helpCenter")}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="font-headline text-xs font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
          >
            {tLogin("privacy")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

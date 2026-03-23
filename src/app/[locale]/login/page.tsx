"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/UserContext";
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const inputClassName =
  "h-14 rounded-md border-0 bg-surface-container-highest px-5 text-lumina-body-lg text-on-surface shadow-none placeholder:text-outline transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 md:px-6";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("login");
  const tAuth = useTranslations("auth");
  const [shouldRedirectAfterLogin, setShouldRedirectAfterLogin] =
    useState(false);

  const year = new Date().getFullYear();

  useEffect(() => {
    if (!shouldRedirectAfterLogin) return;
    if (!user) return;

    if (user.is_student && user.is_tutor) {
      router.push(`/${locale}/dashboard`);
    } else if (user.is_tutor) {
      router.push(`/${locale}/teacher-profile`);
    } else {
      router.push(`/${locale}/student-profile`);
    }
  }, [shouldRedirectAfterLogin, user, router, locale]);

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
    setLoginError(null);
    setShouldRedirectAfterLogin(false);

    if (!validateEmail(email)) {
      setEmailError(t("invalidEmail"));
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      setShouldRedirectAfterLogin(true);
    } catch (error: unknown) {
      setLoginError(
        error instanceof Error &&
          (error.message === "Invalid login credentials" ||
            error.message.includes("Invalid"))
          ? t("invalidCredentials")
          : t("genericError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center overflow-x-hidden bg-surface px-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] font-sans max-md:justify-start max-md:pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] sm:px-5 md:justify-center md:px-10 md:py-12 lg:px-8 [background-image:radial-gradient(at_0%_0%,hsla(263,74%,85%,1)_0,transparent_50%),radial-gradient(at_100%_100%,hsla(263,74%,92%,1)_0,transparent_50%)] dark:bg-surface-dim dark:[background-image:radial-gradient(at_0%_0%,rgba(167,139,250,0.14)_0,transparent_45%),radial-gradient(at_100%_100%,rgba(112,42,225,0.1)_0,transparent_50%)]"
    >
      {/* Mobile: halo suave (sin orbes pesados) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden md:hidden"
        aria-hidden
      >
        <div className="absolute -right-8 top-[12%] h-48 w-48 rounded-full bg-primary-container/20 blur-3xl dark:bg-primary/12" />
        <div className="absolute -left-10 bottom-[30%] h-56 w-56 rounded-full bg-secondary-container/15 blur-3xl dark:bg-secondary/8" />
      </div>

      {/* Tablet (~md–lg): orbes ambientales, misma línea que HomeContent */}
      <div
        className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
        aria-hidden
      >
        <div className="absolute -left-16 top-[18%] h-64 w-64 rounded-full bg-primary-container/25 blur-3xl lg:h-72 lg:w-72 dark:bg-primary/15" />
        <div className="absolute -right-20 bottom-[22%] h-72 w-72 rounded-full bg-secondary-container/25 blur-3xl lg:-right-12 lg:bottom-[25%] dark:bg-secondary/10" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl lg:hidden dark:bg-primary/10" />
      </div>

      <main className="relative z-10 w-full max-w-[480px] space-y-7 pb-6 md:max-w-[540px] md:space-y-11 md:pb-36 lg:max-w-[480px] lg:space-y-12 lg:pb-28">
        <div className="space-y-2 text-center max-md:px-0.5 md:space-y-4">
          <h1 className="font-headline text-[1.75rem] font-extrabold leading-display tracking-display text-on-background sm:text-lumina-h1 md:text-[2.25rem] md:leading-[1.15] lg:text-lumina-h1-lg">
            {t("brandName")}
          </h1>
          <p className="text-lumina-body font-medium leading-body tracking-tight text-on-surface-variant sm:text-lumina-body-lg md:max-w-md md:mx-auto lg:max-w-none">
            {t("tagline")}
          </p>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest/85 p-6 shadow-lumina-sm ring-1 ring-outline-variant/10 backdrop-blur-2xl dark:bg-surface-container-lowest/75 sm:p-7 md:rounded-xl md:bg-surface-container-lowest/80 md:p-10 md:shadow-lumina-lg lg:p-12 lg:shadow-[0_30px_60px_-15px_rgba(112,42,225,0.08)]">
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="ml-1 font-headline text-sm font-semibold text-on-surface"
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
                className={`${inputClassName} ${emailError ? "ring-2 ring-error/40" : ""}`}
              />
              {emailError ? (
                <p className="text-sm text-error">{emailError}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <label
                  htmlFor="password"
                  className="font-headline text-sm font-semibold text-on-surface"
                >
                  {t("password")}
                </label>
                <Link
                  href={`/${locale}/contact`}
                  className="text-xs font-semibold text-primary transition-colors hover:text-primary-dim sm:shrink-0"
                >
                  {tAuth("forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
                    showPassword ? t("hidePassword") : t("showPassword")
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

            {loginError ? (
              <Alert className="border border-error/25 bg-error-container/15 text-on-error-container">
                <AlertDescription className="text-on-error-container">
                  {loginError}
                </AlertDescription>
              </Alert>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-full bg-gradient-to-br from-primary to-primary-dim font-headline text-lumina-button font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:h-14"
            >
              {isSubmitting ? t("loading") : t("login")}
            </button>
          </form>
        </div>

        <p className="text-center text-lumina-body font-medium text-on-surface-variant sm:text-sm">
          {t("dontHaveAccount")}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {t("joinNow")}
          </Link>
        </p>

        {/* Mobile: pie en flujo (el diseño desktop oculta pie fijo en < md) */}
        <div className="mt-6 flex w-full flex-col items-center gap-4 border-t border-outline-variant/15 pt-6 md:hidden">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href={`/${locale}/contact`}
              className="font-headline text-[0.6875rem] font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
            >
              {t("helpCenter")}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="font-headline text-[0.6875rem] font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
            >
              {t("privacy")}
            </Link>
          </div>
          <p className="text-center font-headline text-[0.6875rem] font-bold uppercase tracking-overline text-outline/90">
            {t("copyright", { year })}
          </p>
        </div>
      </main>

      <footer className="pointer-events-none fixed bottom-6 left-0 hidden w-full items-center justify-between px-8 md:flex md:px-10 lg:bottom-8 lg:px-12">
        <p className="pointer-events-auto font-headline text-xs font-bold uppercase tracking-overline text-outline">
          {t("copyright", { year })}
        </p>
        <div className="flex gap-8 pointer-events-auto">
          <Link
            href={`/${locale}/contact`}
            className="font-headline text-xs font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
          >
            {t("helpCenter")}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="font-headline text-xs font-bold uppercase tracking-overline text-outline transition-colors hover:text-primary"
          >
            {t("privacy")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

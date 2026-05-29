"use client";

import { useAuth } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

import { BrandLogo } from "@/components/ds/BrandLogo";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

function getSafeRedirectNext(locale: string, raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/")) return null;
  if (decoded.includes("//")) return null;
  if (decoded.includes("\\")) return null;
  if (!decoded.startsWith(`/${locale}/`)) return null;
  return decoded;
}

const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3";
const INPUT =
  "mt-1.5 block w-full rounded-ft border border-ft-line bg-ft-surface-1 px-4 py-3.5 text-sm text-ft-ink outline-none transition-colors placeholder:text-ft-ink-3 focus:border-ft-accent-deep focus:bg-ft-paper";

export default function LoginClient({ locale }: { locale: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = useMemo(
    () => getSafeRedirectNext(locale, searchParams.get("next")),
    [locale, searchParams]
  );
  const t = useTranslations("login");
  const tAuth = useTranslations("auth");
  const [shouldRedirectAfterLogin, setShouldRedirectAfterLogin] =
    useState(false);

  useEffect(() => {
    if (!shouldRedirectAfterLogin) return;
    if (!user) return;

    if (user.is_student && safeNext) {
      router.push(safeNext);
      return;
    }
    if (user.is_student && user.is_tutor) {
      router.push(`/${locale}/dashboard`);
    } else if (user.is_tutor) {
      router.push(`/${locale}/teacher-profile`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  }, [shouldRedirectAfterLogin, user, router, locale, safeNext]);

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

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ft-paper">
      <div
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-7 pt-10"
        style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top))" }}
      >
        <Link
          href={`/${locale}/`}
          aria-label="FreeTime"
          className="mb-9 inline-block w-fit transition-transform hover:scale-105"
        >
          <BrandLogo size={48} priority />
        </Link>

        <h1 className="m-0 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-ft-ink">
          {t.rich("welcomeHeadline", {
            accent: (chunks) => (
              <span className="text-ft-accent-deep">{chunks}</span>
            ),
          })}
        </h1>
        <p className="mb-8 mt-3 text-sm text-ft-ink-3">
          {t("welcomeSubtitle")}
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
          noValidate
        >
          <div>
            <label htmlFor="email" className={LABEL}>
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("input.email")}
              value={email}
              onChange={handleEmailChange}
              required
              className={cn(
                INPUT,
                emailError && "border-red-500/50 focus:border-red-500/70"
              )}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-700">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={LABEL}>
              {t("password")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("input.password")}
                value={password}
                onChange={handlePasswordChange}
                required
                className={cn(INPUT, "pr-12")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ft-ink-3 transition-colors hover:text-ft-ink"
              >
                {showPassword ? (
                  <EyeOff width={18} height={18} />
                ) : (
                  <Eye width={18} height={18} />
                )}
              </button>
            </div>
          </div>

          <Link
            href={`/${locale}/contact`}
            className="-mt-1 self-end text-xs text-ft-ink-3 transition-colors hover:text-ft-ink"
          >
            {tAuth("forgotPassword")}
          </Link>

          {loginError && (
            <div className="rounded-ft border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 w-full rounded-ft-md bg-ft-ink px-4 py-4 text-sm font-semibold text-ft-paper transition-colors hover:bg-[#2a241b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("loading") : t("login")}
          </button>
        </form>
      </div>

      <div
        className="mx-auto w-full max-w-md px-7 pb-7 pt-5 text-center text-[13px] text-ft-ink-3"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        {t("dontHaveAccount")}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-semibold text-ft-ink hover:underline"
        >
          {t("joinNow")}
        </Link>
      </div>
    </div>
  );
}

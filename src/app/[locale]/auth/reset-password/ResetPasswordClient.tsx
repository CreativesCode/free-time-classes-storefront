"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/ds/BrandLogo";
import { useAuth } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";


const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3";
const INPUT =
  "mt-1.5 block w-full rounded-ft border border-ft-line bg-ft-surface-1 px-4 py-3.5 text-sm text-ft-ink outline-none transition-colors placeholder:text-ft-ink-3 focus:border-ft-accent-deep focus:bg-ft-paper";

export default function ResetPasswordClient({ locale }: { locale: string }) {
  const t = useTranslations("passwordReset");
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordTooShort", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(
          updateError.code === "same_password" ? t("samePassword") : t("genericError")
        );
        return;
      }
      toast.success(t("updated"));
      router.push(`/${locale}/dashboard`);
    } catch {
      setError(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // The recovery link signs the user in through /auth/callback; without a
  // session the link expired or was opened elsewhere.
  const hasSession = Boolean(user);

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

        <h1 className="m-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-ft-ink">
          {t("resetTitle")}
        </h1>

        {isLoading ? (
          <div className="mt-8 h-8 w-8 animate-spin rounded-full border-2 border-ft-ink border-t-transparent" />
        ) : !hasSession ? (
          <>
            <p className="mb-8 mt-3 text-sm text-ft-ink-3">{t("linkExpired")}</p>
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="w-full rounded-ft-md bg-ft-ink px-4 py-4 text-center text-sm font-semibold text-ft-paper transition-colors hover:bg-[#2a241b]"
            >
              {t("requestNewLink")}
            </Link>
          </>
        ) : (
          <>
            <p className="mb-8 mt-3 text-sm text-ft-ink-3">{t("resetDescription")}</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
              <div>
                <label htmlFor="password" className={LABEL}>
                  {t("newPassword")}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="confirm" className={LABEL}>
                  {t("confirmPassword")}
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={INPUT}
                />
              </div>

              {error && (
                <div className="rounded-ft border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full rounded-ft-md bg-ft-ink px-4 py-4 text-sm font-semibold text-ft-paper transition-colors hover:bg-[#2a241b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("saving") : t("savePassword")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

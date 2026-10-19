"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { BrandLogo } from "@/components/ds/BrandLogo";
import { createClient } from "@/lib/supabase/client";

const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3";
const INPUT =
  "mt-1.5 block w-full rounded-ft border border-ft-line bg-ft-surface-1 px-4 py-3.5 text-sm text-ft-ink outline-none transition-colors placeholder:text-ft-ink-3 focus:border-ft-accent-deep focus:bg-ft-paper";

export default function ForgotPasswordClient({ locale }: { locale: string }) {
  const t = useTranslations("passwordReset");
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError(t("invalidEmail"));
      return;
    }

    try {
      setIsSubmitting(true);
      const next = encodeURIComponent(`/${locale}/auth/reset-password`);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${next}`,
      });
      // Same screen whether or not the account exists (no account enumeration);
      // only rate limits are worth surfacing.
      if (resetError && resetError.status === 429) {
        setError(t("rateLimited"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("genericError"));
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

        <h1 className="m-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-ft-ink">
          {t("forgotTitle")}
        </h1>
        <p className="mb-8 mt-3 text-sm text-ft-ink-3">
          {sent ? t("sentDescription") : t("forgotDescription")}
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div>
              <label htmlFor="email" className={LABEL}>
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {isSubmitting ? t("sending") : t("sendLink")}
            </button>
          </form>
        )}
      </div>

      <div
        className="mx-auto w-full max-w-md px-7 pb-7 pt-5 text-center text-[13px] text-ft-ink-3"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        <Link href={`/${locale}/login`} className="font-semibold text-ft-ink hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}

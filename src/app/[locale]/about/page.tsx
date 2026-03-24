"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

export default function AboutPage() {
  const t = useTranslations("aboutUs");
  const locale = useLocale();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 md:pb-20 md:pt-12 lg:px-8 lg:pt-16">
      <header className="mb-8 text-center md:mb-12">
        <p className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
          FreeTime Classes
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {t("title")}
        </h1>
      </header>

      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-7">
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {t("mission.title")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {t("mission.description")}
            </p>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-7">
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {t("vision.title")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              {t("vision.description")}
            </p>
          </section>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center md:p-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="font-bold text-foreground">{t("values.flexibility.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("values.flexibility.description")}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center md:p-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-foreground">{t("values.community.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("values.community.description")}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center sm:col-span-2 md:col-span-1 md:p-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-bold text-foreground">{t("values.quality.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("values.quality.description")}</p>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-center text-primary-foreground md:p-10">
          <div className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              {t("joinUs.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-primary-foreground/85 md:text-base">
              {t("joinUs.description")}
            </p>
            <Link
              href={`/${locale}/register`}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-background px-8 py-3 text-sm font-bold text-primary transition hover:bg-background/90"
            >
              {t("joinUs.cta")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

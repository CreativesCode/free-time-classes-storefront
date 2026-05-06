import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ArrowRight, Compass, Heart, Sparkles, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutUs" });
  return buildPageMetadata({
    locale,
    path: "/about",
    title: t("metaTitle"),
    description: t("metaDescription"),
    titleAbsolute: true,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);

  const t = await getTranslations("aboutUs");

  return (
    <main className="mx-auto w-full max-w-screen-xl px-5 pb-16 pt-10 md:px-9 md:pb-20 md:pt-14 lg:pt-20">
      <header className="mb-10 text-center md:mb-14">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ft-surface-2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ft-accent-deep">
          <Sparkles width={11} height={11} />
          {t("badge")}
        </p>
        <h1 className="m-0 text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-ft-ink md:text-[48px] lg:text-[56px]">
          {t("title")}
        </h1>
      </header>

      <div className="space-y-6 md:space-y-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          <section className="rounded-ft-2xl border border-ft-line-soft bg-ft-paper p-6 md:p-8">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-ft-md bg-ft-surface-2 text-ft-accent-deep">
              <Compass width={18} height={18} />
            </div>
            <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-ft-ink md:text-[24px]">
              {t("mission.title")}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ft-ink-2 md:text-[15px]">
              {t("mission.description")}
            </p>
          </section>

          <section className="rounded-ft-2xl border border-ft-line bg-ft-surface-2 p-6 md:p-8">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ft-accent-deep">
              {t("vision.title")}
            </div>
            <h2 className="m-0 text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] text-ft-ink md:text-[28px]">
              <span className="font-instrument-serif italic">
                {t("vision.description")}
              </span>
            </h2>
          </section>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
          <ValueCard
            icon={<Sparkles width={18} height={18} />}
            title={t("values.flexibility.title")}
            description={t("values.flexibility.description")}
          />
          <ValueCard
            icon={<Users width={18} height={18} />}
            title={t("values.community.title")}
            description={t("values.community.description")}
          />
          <ValueCard
            icon={<Heart width={18} height={18} />}
            title={t("values.quality.title")}
            description={t("values.quality.description")}
            className="sm:col-span-2 md:col-span-1"
          />
        </section>

        <section className="relative overflow-hidden rounded-ft-2xl bg-gradient-to-br from-[#2A2520] to-[#1A1714] px-7 py-10 text-center text-ft-paper md:px-12 md:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,168,106,0.30), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="m-0 text-[26px] font-semibold tracking-[-0.025em] md:text-[34px]">
              <span className="font-instrument-serif italic">
                {t("joinUs.title")}
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[13.5px] text-white/70 md:text-[15px]">
              {t("joinUs.description")}
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ft-accent px-6 py-3 text-[13px] font-semibold text-[#1a1410] transition-colors hover:brightness-95"
            >
              {t("joinUs.cta")}
              <ArrowRight width={14} height={14} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function ValueCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <article
      className={`rounded-ft-lg border border-ft-line-soft bg-ft-paper p-5 text-center md:p-7 ${className ?? ""}`}
    >
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-ft-surface-2 text-ft-accent-deep">
        {icon}
      </div>
      <h3 className="m-0 text-[15px] font-semibold tracking-tight text-ft-ink">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-ft-ink-3">
        {description}
      </p>
    </article>
  );
}

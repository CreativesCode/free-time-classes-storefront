"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle,
  CircleDollarSign,
  Clock3,
  LinkIcon,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/context/UserContext";

export type BecomeTutorCopy = {
  title: string;
  subtitle: string;
  alreadyTutor: string;
  goToProfile: string;
  benefit3Title: string;
  benefit3Description: string;
  benefit1Title: string;
  benefit1Description: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
  upgradeAccount: string;
  registerNow: string;
  badge: string;
  formProfessionalTitle: string;
  formProfessionalDescription: string;
  formMainSubjectLabel: string;
  formMainSubjectPlaceholder: string;
  formExperienceLabel: string;
  formExperiencePlaceholder: string;
  formPortfolioLabel: string;
  formPortfolioPlaceholder: string;
  formRatesTitle: string;
  formRatesDescription: string;
  formSessionRateLabel: string;
  formSessionRatePlaceholder: string;
  formRateHint: string;
  termsAccept: string;
  saveDraft: string;
  footerReviewData: string;
  footerHaveAccount: string;
  linkGoToSettings: string;
  linkSignIn: string;
};

export default function BecomeTutorClient({
  locale,
  copy,
}: {
  locale: string;
  copy: BecomeTutorCopy;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ft-ink-3 border-t-ft-ink" />
      </div>
    );
  }

  if (user?.is_tutor) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <div className="w-full max-w-md rounded-ft-2xl border border-ft-line bg-ft-paper p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ft-accent-soft text-ft-accent-deep">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-ft-ink">
            {copy.alreadyTutor}
          </h1>
          <Link
            href={`/${locale}/teacher-profile`}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ft-ink px-6 text-[14px] font-semibold text-ft-paper transition-colors hover:bg-[#2a241b]"
          >
            {copy.goToProfile}
            <ArrowRight width={14} height={14} />
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    {
      icon: BadgeCheck,
      title: copy.benefit3Title,
      description: copy.benefit3Description,
    },
    {
      icon: CircleDollarSign,
      title: copy.benefit1Title,
      description: copy.benefit1Description,
    },
  ];

  const steps = [
    {
      icon: BookOpen,
      title: copy.step1Title,
      description: copy.step1Description,
    },
    {
      icon: Clock3,
      title: copy.step2Title,
      description: copy.step2Description,
    },
    {
      icon: Users,
      title: copy.step3Title,
      description: copy.step3Description,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <main className="flex flex-col gap-8 px-5 pb-16 pt-10 md:gap-10 md:px-9 md:pt-14 lg:flex-row lg:gap-12 lg:pt-16">
        {/* Left column: hero + benefits + steps */}
        <section className="w-full lg:sticky lg:top-8 lg:h-fit lg:w-5/12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-ft-surface-2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ft-accent-deep">
            <Sparkles width={11} height={11} />
            {copy.badge}
          </div>
          <h1 className="m-0 mt-5 text-balance text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-ft-ink md:text-[44px] lg:text-[52px]">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-ft-ink-2 md:text-[17px]">
            {copy.subtitle}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-ft-lg border border-ft-line-soft bg-ft-paper p-4"
              >
                <item.icon className="h-5 w-5 text-ft-accent-deep" />
                <h3 className="mt-2 text-[14px] font-semibold tracking-tight text-ft-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ft-ink-3">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          {/* Steps — mobile horizontal scroll */}
          <div className="hide-scroll mt-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex min-w-[140px] flex-1 flex-col items-center gap-2 rounded-ft-lg border border-ft-line-soft bg-ft-paper p-3 text-center"
              >
                <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-ft-ink text-[11px] font-bold text-ft-paper">
                  {index + 1}
                </div>
                <step.icon className="h-4 w-4 text-ft-accent-deep" />
                <p className="text-[11px] font-semibold leading-tight text-ft-ink">
                  {step.title}
                </p>
              </div>
            ))}
          </div>

          {/* Steps — desktop vertical */}
          <div className="mt-8 hidden flex-col gap-2.5 md:flex">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-ft-lg border border-ft-line-soft bg-ft-paper p-3.5"
              >
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-ft-ink text-[12px] font-bold text-ft-paper">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-ft-ink">
                    <step.icon className="h-4 w-4 text-ft-accent-deep" />
                    {step.title}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ft-ink-3">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right column: form */}
        <section className="w-full lg:w-7/12">
          <div className="rounded-ft-2xl border border-ft-line bg-ft-paper p-5 sm:p-7 md:p-9">
            <form className="space-y-7">
              <div className="space-y-4">
                <div className="border-l-2 border-ft-accent pl-3.5">
                  <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-ft-ink md:text-[22px]">
                    {copy.formProfessionalTitle}
                  </h2>
                  <p className="mt-1 text-[13px] text-ft-ink-3">
                    {copy.formProfessionalDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InputField
                    icon={BookOpen}
                    label={copy.formMainSubjectLabel}
                    placeholder={copy.formMainSubjectPlaceholder}
                  />
                  <InputField
                    icon={BriefcaseBusiness}
                    label={copy.formExperienceLabel}
                    placeholder={copy.formExperiencePlaceholder}
                  />
                </div>
                <InputField
                  icon={LinkIcon}
                  label={copy.formPortfolioLabel}
                  placeholder={copy.formPortfolioPlaceholder}
                />
              </div>

              <div className="space-y-4">
                <div className="border-l-2 border-ft-accent pl-3.5">
                  <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-ft-ink md:text-[22px]">
                    {copy.formRatesTitle}
                  </h2>
                  <p className="mt-1 text-[13px] text-ft-ink-3">
                    {copy.formRatesDescription}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr]">
                  <InputField
                    icon={CircleDollarSign}
                    label={copy.formSessionRateLabel}
                    placeholder={copy.formSessionRatePlaceholder}
                  />
                  <div className="flex items-start gap-2 rounded-ft-md border border-ft-line bg-ft-surface-2 p-3.5 text-[12px] leading-relaxed text-ft-accent-deep">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {copy.formRateHint}
                  </div>
                </div>
              </div>

              <div className="rounded-ft border border-ft-line-soft bg-ft-surface-1 p-3.5 text-[12px] text-ft-ink-2">
                <div className="flex items-start gap-3">
                  <input
                    className="mt-0.5 h-4 w-4 accent-ft-ink"
                    type="checkbox"
                    defaultChecked
                  />
                  <p className="m-0 leading-relaxed">{copy.termsAccept}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <HeroCta
                  user={user}
                  locale={locale}
                  upgradeAccountText={copy.upgradeAccount}
                  registerNowText={copy.registerNow}
                />
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-ft-line bg-ft-paper px-7 text-[13px] font-semibold text-ft-ink hover:bg-ft-surface-1"
                >
                  {copy.saveDraft}
                </button>
              </div>
            </form>

            <p className="mt-7 text-center text-[13px] text-ft-ink-3">
              {user ? copy.footerReviewData : copy.footerHaveAccount}{" "}
              <Link
                href={user ? `/${locale}/settings` : `/${locale}/login`}
                className="font-semibold text-ft-ink hover:text-ft-accent-deep"
              >
                {user ? copy.linkGoToSettings : copy.linkSignIn}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function InputField({
  icon: Icon,
  label,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="block pl-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3">
        {label}
      </span>
      <div className="group relative mt-1.5">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ft-ink-3 transition-colors group-focus-within:text-ft-ink-2" />
        <input
          readOnly
          value=""
          placeholder={placeholder}
          className="h-12 w-full rounded-ft border border-ft-line bg-ft-surface-1 pl-10 pr-4 text-[14px] text-ft-ink outline-none placeholder:text-ft-ink-3 focus:border-ft-ink-3"
        />
      </div>
    </label>
  );
}

function HeroCta({
  user,
  locale,
  upgradeAccountText,
  registerNowText,
}: {
  user: ReturnType<typeof useAuth>["user"];
  locale: string;
  upgradeAccountText: string;
  registerNowText: string;
}) {
  const target = user ? `/${locale}/settings` : `/${locale}/register`;
  const label = user ? upgradeAccountText : registerNowText;
  return (
    <Link
      href={target}
      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ft-ink px-7 text-[14px] font-semibold text-ft-paper hover:bg-[#2a241b]"
    >
      {label}
      <ArrowRight width={14} height={14} />
    </Link>
  );
}

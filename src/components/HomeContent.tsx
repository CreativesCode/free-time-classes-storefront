"use client";

import { Badge } from "@/components/ui/badge";
import type { HomeCourseCard, HomeFeaturedTeacher } from "@/types/home";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PenLine, Sparkles, Users } from "lucide-react";
import { useMemo } from "react";

const HERO_IMAGE =
  "/images/hero-desktop.jpg";

/** stitch/landing_page_mobile — hero 4:3 + premium shadow */
const HERO_IMAGE_MOBILE =
  "/images/hero-mobile.jpg";

const BENTO_IMAGE = "/images/bento-network.jpg";

interface HomeContentProps {
  initialCourses: HomeCourseCard[];
  initialFeaturedTeachers: HomeFeaturedTeacher[];
}

export default function HomeContent({
  initialCourses,
  initialFeaturedTeachers,
}: HomeContentProps) {
  const t = useTranslations("home");
  const locale = useLocale();

  const popularCourses = useMemo(() => {
    const data = initialCourses;

    const mapCourseLevelLabel = (
      level: HomeCourseCard["level"] | null | undefined
    ) => {
      if (level === "advanced") return t("advanced");
      if (level === "intermediate") return t("intermediate");
      return level ?? "";
    };

    return data.slice(0, 3).map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      teacher: course.tutor?.username ?? "—",
      level: mapCourseLevelLabel(course.level),
      students: course.enrolled_students_count ?? course.max_students ?? 0,
    }));
  }, [initialCourses, t]);

  const bentoAvatars = initialFeaturedTeachers.slice(0, 3);

  return (
    <div className="min-h-[100dvh] bg-background text-on-surface antialiased overflow-x-hidden selection:bg-primary-container/30 selection:text-on-primary-container">
      <main className="pt-20 pb-10 md:pb-0 md:pt-24">
        {/* Hero — mobile: stitch/landing_page_mobile; desktop: landing_page_desktop */}
        <section className="relative px-5 py-12 sm:px-6 md:px-10 lg:px-8 md:py-20 lg:py-24 xl:py-32 max-w-screen-2xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-12 items-center">
            <div className="md:col-span-7 z-10 md:max-w-xl lg:max-w-none md:mx-auto lg:mx-0 md:text-center lg:text-left max-md:space-y-4">
              <span className="inline-block px-4 py-1.5 text-xs md:text-lumina-body font-semibold tracking-wide md:tracking-overline uppercase bg-primary-container/30 text-on-primary-container md:text-primary-dim rounded-full">
                {t("heroBadge")}
              </span>
              <h1 className="text-5xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extrabold tracking-display leading-[1.1] md:leading-display mb-2 md:mb-8 text-on-background">
                {t("heroTitleBefore")}{" "}
                <span className="text-primary italic md:not-italic">
                  {t("heroTitleAccent")}
                </span>{" "}
                {t("heroTitleAfter")}
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-xs md:max-w-xl mb-6 md:mb-12 leading-relaxed md:leading-body md:mx-auto lg:mx-0">
                {t("heroDescription")}
              </p>
              <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:justify-center lg:justify-start">
                <Link
                  href={`/${locale}/courses`}
                  className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-dim text-on-primary py-5 px-8 md:px-10 md:py-5 text-lg font-bold shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  {t("browseCourses")}
                  <ArrowRight
                    className="h-5 w-5 shrink-0 hidden md:block"
                    aria-hidden
                  />
                </Link>
                <Link
                  href={`/${locale}/tutors`}
                  className="inline-flex w-full md:w-auto items-center justify-center rounded-full bg-surface-container-high dark:bg-surface-container-highest/40 text-on-surface py-5 px-8 md:px-10 md:py-5 text-lg font-semibold md:font-bold backdrop-blur-md md:bg-surface-container-highest/50 transition-colors active:scale-[0.98] hover:bg-surface-container-highest"
                >
                  {t("findTutors")}
                </Link>
              </div>
            </div>
            <div className="md:col-span-5 relative mt-2 md:mt-8 lg:mt-0">
              <div className="relative w-full aspect-[4/3] md:hidden rounded-xl overflow-hidden z-10 bg-surface-container-highest shadow-[0_30px_60px_-12px_rgba(112,42,225,0.08)]">
                <Image
                  src={HERO_IMAGE_MOBILE}
                  alt=""
                  fill
                  role="presentation"
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
              </div>
              <div className="relative w-full aspect-[4/5] max-w-md mx-auto hidden md:block md:max-w-lg lg:max-w-none rounded-xl overflow-hidden shadow-lumina-lg z-10 lg:rotate-2 lg:translate-x-2">
                <Image
                  src={HERO_IMAGE}
                  alt=""
                  fill
                  role="presentation"
                  className="object-cover"
                  sizes="(max-width: 1024px) 45vw, 42vw"
                  priority
                />
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -z-10 pointer-events-none hidden md:block" />
              <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-secondary-container/30 rounded-full blur-3xl -z-10 pointer-events-none hidden md:block" />
              <div className="hidden lg:block absolute top-1/2 -right-4 w-48 h-48 border-[20px] border-surface-container rounded-full -z-10 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Bento — why choose us */}
        <section className="px-3 sm:px-6 md:px-10 lg:px-8 py-12 max-md:py-14 md:py-20 lg:py-24 bg-surface-container-low rounded-[2.5rem] md:rounded-[3rem] lg:rounded-[4rem] mx-2 sm:mx-4 md:mx-6 lg:mx-4">
          <div className="max-w-screen-2xl mx-auto">
            <div className="mb-8 space-y-2 md:hidden">
              <h2 className="text-3xl font-bold tracking-tight text-lumina-text-strong dark:text-zinc-50">
                {t("mobileMentorSectionTitle")}
              </h2>
              <div className="h-1 w-12 bg-primary rounded-full" />
            </div>
            <div className="hidden md:flex flex-col md:flex-row md:items-start lg:items-end justify-between mb-12 md:mb-16 lg:mb-20 gap-6 md:gap-8">
              <div className="max-w-2xl md:max-w-2xl lg:max-w-2xl">
                <h2 className="text-lumina-h2 md:text-lumina-h2-lg font-bold tracking-headline mb-4 md:mb-6 text-lumina-text-strong dark:text-zinc-50">
                  {t("architectureTitle")}
                </h2>
                <p className="text-lumina-body-lg text-on-surface-variant">
                  {t("architectureSubtitle")}
                </p>
              </div>
              <div className="pb-0 md:pb-0 lg:pb-2 shrink-0 md:self-start lg:self-end">
                <span className="text-primary font-bold text-lumina-body-lg">
                  {t("reasonsLabel")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-6 lg:gap-8">
              <div className="md:col-span-2 lg:col-span-2 bg-surface-container-lowest dark:bg-zinc-900/40 p-8 md:p-10 lg:p-12 rounded-xl flex flex-col justify-between min-h-[280px] md:min-h-[320px] lg:min-h-[400px] shadow-lumina-sm transition-transform hover:-translate-y-1 border border-outline-variant/10 dark:border-outline-variant/20">
                <Sparkles
                  className="h-12 w-12 md:h-14 md:w-14 text-primary shrink-0"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <div className="mt-8">
                  <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 text-lumina-text-strong dark:text-zinc-50">
                    {t("expertTeachers")}
                  </h3>
                  <p className="text-on-surface-variant text-lumina-body-lg max-w-lg leading-body">
                    {t("expertTeachersDescription")}
                  </p>
                </div>
              </div>
              <div className="bg-primary text-on-primary p-8 md:p-10 lg:p-12 rounded-xl flex flex-col justify-between min-h-[240px] md:min-h-[280px] lg:min-h-[400px] shadow-xl shadow-primary/10 md:shadow-lumina transition-transform hover:-translate-y-1 md:col-span-1 lg:col-span-1">
                <Users
                  className="h-12 w-12 md:h-14 md:w-14 shrink-0 opacity-95"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <div className="mt-8">
                  <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">
                    {t("customClasses")}
                  </h3>
                  <p className="text-primary-container/95 text-lumina-body-lg leading-body">
                    {t("customClassesDescription")}
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-highest dark:bg-zinc-800/50 p-8 md:p-10 lg:p-12 rounded-xl flex flex-col justify-between transition-transform hover:-translate-y-1 border border-outline-variant/10 md:col-span-1">
                <PenLine
                  className="h-12 w-12 md:h-14 md:w-14 text-primary shrink-0"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <div className="mt-8">
                  <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 text-lumina-text-strong dark:text-zinc-50">
                    {t("totalFlexibility")}
                  </h3>
                  <p className="text-on-surface-variant text-lumina-body-lg leading-body">
                    {t("totalFlexibilityDescription")}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-2 relative bg-zinc-900 text-white rounded-xl overflow-hidden min-h-[320px] md:min-h-[360px] lg:min-h-[400px] group">
                <Image
                  src={BENTO_IMAGE}
                  alt=""
                  fill
                  role="presentation"
                  className="object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                />
                <div className="relative z-10 p-8 md:p-12 h-full min-h-[320px] md:min-h-[400px] flex flex-col justify-between">
                  <h3 className="text-2xl md:text-4xl font-black max-w-sm leading-none tracking-tight">
                    {t("bentoNetworkTitle")}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-8">
                    {bentoAvatars.length > 0 ? (
                      <div className="flex -space-x-3">
                        {bentoAvatars.map((teacher) => (
                          <div
                            key={teacher.id}
                            className="relative h-12 w-12 rounded-full border-4 border-zinc-900 overflow-hidden bg-zinc-800"
                          >
                            <Image
                              src={teacher.profilePicture}
                              alt={teacher.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex -space-x-3">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-12 w-12 rounded-full border-4 border-zinc-900 bg-zinc-700"
                          />
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/${locale}/register`}
                      className="text-zinc-300 font-medium hover:text-white transition-colors text-lumina-body-lg"
                    >
                      {t("bentoNetworkCta")} →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile-only: stats + CTA píldora (stitch/landing_page_mobile) */}
        <section className="md:hidden px-5 mt-4 mb-4">
          <div className="py-10 px-6 rounded-xl bg-surface-container-lowest dark:bg-zinc-900/50 border border-outline-variant/10 flex flex-col items-center text-center gap-8 shadow-lumina-sm">
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-primary tracking-tighter">
                {t("statWorkshopsValue")}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                {t("statWorkshopsLabel")}
              </div>
            </div>
            <div className="w-full h-px bg-outline-variant/20" />
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-primary tracking-tighter">
                {t("statLearnersValue")}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                {t("statLearnersLabel")}
              </div>
            </div>
            <div className="w-full h-px bg-outline-variant/20" />
            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-primary tracking-tighter">
                {t("statRatingValue")}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">
                {t("statRatingLabel")}
              </div>
            </div>
          </div>
          <div className="mt-8 p-1 rounded-full bg-surface-container-highest">
            <div className="bg-gradient-to-r from-primary to-primary-dim p-8 rounded-full text-center space-y-4 shadow-xl shadow-primary/15">
              <h2 className="text-on-primary font-bold text-2xl tracking-tight">
                {t("mobileJourneyTitle")}
              </h2>
              <Link
                href={`/${locale}/register`}
                className="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-transform"
              >
                {t("registerNow")}
              </Link>
            </div>
          </div>
        </section>

        {/* Featured tutors */}
        <section className="px-4 sm:px-6 md:px-10 lg:px-8 py-12 md:py-20 lg:py-24 max-w-screen-2xl mx-auto">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-lumina-h2 md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-headline mb-4 md:mb-6 text-lumina-text-strong dark:text-zinc-50">
              {t("featuredTeachersTitle")}
            </h2>
            <p className="text-on-surface-variant text-lumina-body-lg max-w-xl mx-auto">
              {t("teachersSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {initialFeaturedTeachers.map((teacher) => (
              <Link
                key={teacher.id}
                href={`/${locale}/tutors`}
                className="group block text-left"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-5 md:mb-6 shadow-lumina-sm">
                  <Image
                    src={teacher.profilePicture}
                    alt={teacher.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-lumina-body-sm font-bold uppercase tracking-overline">
                      {teacher.specialty}
                    </span>
                  </div>
                </div>
                <h4 className="text-xl md:text-2xl font-bold mb-1 text-lumina-text-strong dark:text-zinc-50">
                  {teacher.name}
                </h4>
                <p className="text-on-surface-variant text-lumina-body-lg mb-3">
                  {teacher.yearsOfExperience} {t("years")} ·{" "}
                  {teacher.coursesCount} {t("coursesText")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-surface-container-high text-on-surface border-0"
                  >
                    {t("findTutors")}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular courses */}
        <section className="px-4 sm:px-6 md:px-10 lg:px-8 py-16 md:py-20 lg:py-24 bg-surface-container-lowest/80 dark:bg-zinc-900/30">
          <div className="max-w-screen-2xl mx-auto">
            <div className="text-center mb-12 md:mb-14 lg:mb-16">
              <h2 className="text-lumina-h2 md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-headline mb-4 md:mb-6 text-lumina-text-strong dark:text-zinc-50">
                {t("popularCoursesTitle")}
              </h2>
              <p className="text-on-surface-variant text-lumina-body-lg max-w-xl mx-auto">
                {t("coursesSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-6 lg:gap-8">
              {popularCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/${locale}/courses/${course.id}`}
                  className="group block h-full"
                >
                  <article className="h-full bg-surface-container-lowest dark:bg-zinc-900/60 rounded-xl p-6 md:p-8 shadow-lumina-sm hover:shadow-lumina transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10 flex flex-col">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-lumina-text-strong dark:text-zinc-50 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-on-surface-variant text-lumina-body-lg line-clamp-3 flex-1 leading-body">
                      {course.description}
                    </p>
                    <div className="mt-6 pt-6 border-t border-outline-variant/15 space-y-3">
                      <p className="text-lumina-body text-lumina-text-secondary">
                        <span className="font-semibold text-on-surface-variant">
                          {t("teacher")}:
                        </span>{" "}
                        {course.teacher}
                      </p>
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-outline-variant/40 text-on-surface-variant"
                        >
                          {course.level}
                        </Badge>
                        <span className="text-lumina-body text-lumina-text-secondary">
                          {course.students} {t("students")}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band — desktop/tablet (mobile usa la píldora arriba) */}
        <section className="hidden md:block px-4 sm:px-6 md:px-10 lg:px-8 py-16 md:py-20 lg:py-24">
          <div className="max-w-5xl mx-auto relative rounded-xl overflow-hidden bg-primary p-10 md:p-12 lg:p-16 xl:p-24 text-center shadow-lumina-lg">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <div className="absolute top-0 right-0 w-72 md:w-96 h-72 md:h-96 bg-primary-container/40 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 md:w-96 h-72 md:h-96 bg-primary-dim/60 blur-[120px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-7xl font-black text-on-primary mb-6 md:mb-8 tracking-tight">
                {t("ctaBandTitle")}
              </h2>
              <p className="text-lumina-body-lg md:text-xl text-on-primary/85 mb-8 md:mb-12 max-w-2xl mx-auto font-medium leading-body">
                {t("ctaBandSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
                <Link
                  href={`/${locale}/register`}
                  className="inline-flex justify-center rounded-full bg-primary-fixed-dim text-on-primary-fixed px-8 py-4 md:px-10 md:py-5 text-lumina-button md:text-lg font-extrabold hover:bg-white hover:text-primary transition-colors shadow-xl active:scale-[0.98]"
                >
                  {t("registerNow")}
                </Link>
                <Link
                  href={`/${locale}/courses`}
                  className="inline-flex justify-center rounded-full bg-white/15 backdrop-blur-sm text-on-primary px-8 py-4 md:px-10 md:py-5 text-lumina-button md:text-lg font-bold border border-on-primary/25 hover:bg-white/25 transition-colors active:scale-[0.98]"
                >
                  {t("browseCourses")}
                </Link>
              </div>
              <p className="mt-8 text-on-primary/60 text-lumina-body-sm font-medium uppercase tracking-overline">
                {t("ctaFinePrint")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

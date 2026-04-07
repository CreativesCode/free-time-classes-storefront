import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Star,
  Users,
} from "lucide-react";

import { buildPageMetadata, truncateForMeta } from "@/lib/seo/page-metadata";
import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import { createCatalogServerClient } from "@/lib/supabase/server-public";
import {
  fetchTutorReviewStatsMap,
  mergeTutorProfileReviewStats,
} from "@/lib/supabase/tutor-review-stats";
import { getCourseCoverPublicUrl, getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";

import type { CourseWithRelations } from "@/types/course";
import type { TutorProfile } from "@/types/tutor";
import { parseCVData } from "@/types/tutor-cv";
import type { User } from "@/types/user";
import type { ReviewWithStudent } from "@/types/review";

import CourseBookingFocus from "@/components/courses/CourseBookingFocus";
import CourseBookingSection from "@/components/courses/CourseBookingSection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const COURSE_PAGE_ID_RE = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  if (!id || !COURSE_PAGE_ID_RE.test(id)) {
    return buildPageMetadata({
      locale,
      path: `/courses/${id}`,
      title: t("courseNotFound.title"),
      description: t("courseNotFound.description"),
    });
  }

  const supabase = createCatalogServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      title,
      description,
      cover_image,
      tutor_profile:tutor_profiles!courses_tutor_id_fkey (
        user:users!tutor_profiles_id_fkey ( username )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return buildPageMetadata({
      locale,
      path: `/courses/${id}`,
      title: t("courseNotFound.title"),
      description: t("courseNotFound.description"),
    });
  }

  const tCourse = await getTranslations({ locale, namespace: "courseDetail" });
  const tp = data.tutor_profile as
    | { user?: { username: string } | null }
    | null
    | undefined;
  const tutorName = tp?.user?.username ?? tCourse("unknownTutor");
  const bodyExcerpt =
    truncateForMeta(data.description ?? "") || t("courseExcerptFallback");
  const description = t("courseDescriptionWithTutor", {
    tutor: tutorName,
    excerpt: bodyExcerpt,
  });
  const title = `${data.title} · ${t("courseTitleSuffix")}`;
  const cover = getCourseCoverPublicUrl(data.cover_image ?? null);

  return buildPageMetadata({
    locale,
    path: `/courses/${id}`,
    title,
    titleAbsolute: true,
    description,
    openGraphImages: cover ? [cover] : undefined,
  });
}

type Translator = Awaited<ReturnType<typeof getTranslations>>;

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}

function TutorAvatar({
  user,
  size = "h-16 w-16",
  textSize = "text-xl",
}: {
  user: { username: string; profile_picture?: string | null };
  size?: string;
  textSize?: string;
}) {
  const avatarUrl = user.profile_picture
    ? getPublicUrl("avatars", user.profile_picture)
    : null;
  const bgColor = getAvatarColor(user.username);
  const initials = user.username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={size}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
      <AvatarFallback style={{ backgroundColor: bgColor }} className={`text-white font-bold ${textSize}`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("courseDetail");
  const supabase = createCatalogServerClient();

  let error = false;
  let course: CourseWithRelations | null = null;
  let tutorProfile: (TutorProfile & { user: User }) | null = null;
  let reviews: ReviewWithStudent[] = [];

  try {
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select(
        `
        *,
        tutor_profile:tutor_profiles!courses_tutor_id_fkey (
          id,
          user:users!tutor_profiles_id_fkey (
            id,
            username,
            email,
            profile_picture
          )
        ),
        subject:subjects (
          id,
          name,
          description,
          icon
        )
      `
      )
      .eq("id", id)
      .single();

    if (courseError && courseError.code !== "PGRST116") {
      throw courseError;
    }

    if (courseData) {
      const row = courseData as CourseWithRelations & {
        tutor_profile?: {
          user?: {
            id: string;
            username: string;
            email: string;
            profile_picture?: string | null;
          } | null;
        } | null;
      };

      course = {
        ...row,
        tutor: resolveCourseTutorUser(row.tutor_profile),
      };

      const [{ data: profileData, error: profileError }, { data: reviewsData, error: reviewsError }, tutorReviewStats] =
        await Promise.all([
          supabase
            .from("tutor_profiles")
            .select(
              `
              *,
              user:users!tutor_profiles_id_fkey (*)
            `
            )
            .eq("id", course.tutor_id)
            .single(),
          supabase
            .from("reviews")
            .select(
              `
              *,
              student:student_profiles!reviews_student_id_fkey(
                id,
                user:users!student_profiles_id_fkey(
                  id,
                  username,
                  profile_picture
                )
              )
            `
            )
            .eq("tutor_id", course.tutor_id)
            .order("created_at", { ascending: false })
            .limit(10),
          fetchTutorReviewStatsMap(supabase, [course.tutor_id]),
        ]);

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }
      if (reviewsError) {
        throw reviewsError;
      }

      tutorProfile = (profileData as (TutorProfile & { user: User }) | null) ?? null;
      if (tutorProfile) {
        tutorProfile = mergeTutorProfileReviewStats(
          tutorProfile,
          tutorReviewStats
        );
      }
      reviews = (reviewsData as ReviewWithStudent[] | null) ?? [];
    }
  } catch {
    error = true;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg text-muted-foreground">{t("loadError")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/courses`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToCourses")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("notFound")}</h2>
        <p className="text-muted-foreground">{t("notFoundDescription")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/courses`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToCourses")}
          </Link>
        </Button>
      </div>
    );
  }

  const levelColors: Record<string, string> = {
    beginner: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    intermediate: "bg-sky-100/80 text-sky-700 border-sky-200",
    advanced: "bg-violet-100/80 text-violet-700 border-violet-200",
  };

  const tutorDisplayName =
    tutorProfile?.user?.username ?? course.tutor?.username ?? t("unknownTutor");

  const tutorUser = tutorProfile?.user ?? course.tutor;
  const ratingValue = course.rating ?? 0;
  const totalReviews = course.total_reviews ?? 0;
  const createdAt = new Date(course.created_at).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });
  const coursePrice = Number(course.price_per_session).toFixed(2);
  const coverUrl = getCourseCoverPublicUrl(course.cover_image);

  return (
    <div className="pb-24 md:pb-28 lg:pb-10">
      <Suspense fallback={null}>
        <CourseBookingFocus />
      </Suspense>
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-slate-50/90 via-white to-white">
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCourses")}
          </Link>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5">
            <div className="relative h-44 w-full sm:h-52 md:h-60 lg:h-[17rem]">
              {coverUrl ? (
                <>
                  <Image
                    src={coverUrl}
                    alt={course.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-slate-950/25 via-transparent to-violet-600/10"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/35 to-transparent"
                    aria-hidden
                  />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 px-6 text-center text-white">
                  <BookOpen className="h-14 w-14 opacity-90 sm:h-16 sm:w-16" aria-hidden />
                  <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/95 sm:text-base">
                    {course.title}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4 md:mt-8 md:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {course.subject && (
                <Badge className="rounded-full bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-700 hover:bg-primary-100">
                  {course.subject.name}
                </Badge>
              )}
              {course.level && (
                <Badge
                  variant="outline"
                  className={`rounded-full border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm ${levelColors[course.level] ?? ""}`}
                >
                  {t(`level.${course.level}`)}
                </Badge>
              )}
              {!course.is_active && (
                <Badge variant="destructive" className="rounded-full text-[11px] uppercase">
                  {t("inactive")}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.1]">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
              {ratingValue > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={ratingValue} size={14} />
                  <span className="font-semibold text-slate-900">{ratingValue.toFixed(1)}</span>
                  {totalReviews > 0 && (
                    <span>
                      ({totalReviews} {t("reviews")})
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary-500" />
                {course.duration_minutes} {t("minutes")}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary-500" />
                {t("maxStudents", { count: course.max_students })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-sm">
                <Clock className="mx-auto h-4 w-4 text-primary-500" />
                <p className="mt-1 text-sm font-bold text-slate-900">{course.duration_minutes}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("minutes")}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-sm">
                <Users className="mx-auto h-4 w-4 text-primary-500" />
                <p className="mt-1 text-sm font-bold text-slate-900">{course.max_students}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("maxStudentsLabel")}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-sm">
                <Calendar className="mx-auto h-4 w-4 text-primary-500" />
                <p className="mt-1 text-sm font-bold text-slate-900">{createdAt}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("createdAt")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:mt-12 lg:grid-cols-12 lg:px-8">
        <div className="space-y-8 md:space-y-10 lg:col-span-8">
          <Card className="border-violet-100/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold md:text-xl">
                <BookOpen className="h-5 w-5 text-primary-500" />
                {t("aboutCourse")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 md:text-base">
                {course.description}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-100/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold md:text-xl">
                <GraduationCap className="h-5 w-5 text-primary-500" />
                {t("courseInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <div className="rounded-xl bg-primary-50/60 p-4 text-center">
                  <Clock className="mx-auto mb-2 h-5 w-5 text-primary-500" />
                  <p className="text-2xl font-extrabold text-slate-900">{course.duration_minutes}</p>
                  <p className="text-[11px] font-medium text-slate-500">{t("minutes")}</p>
                </div>
                <div className="rounded-xl bg-primary-50/60 p-4 text-center">
                  <Users className="mx-auto mb-2 h-5 w-5 text-primary-500" />
                  <p className="text-2xl font-extrabold text-slate-900">{course.max_students}</p>
                  <p className="text-[11px] font-medium text-slate-500">{t("maxStudentsLabel")}</p>
                </div>
                <div className="rounded-xl bg-primary-50/60 p-4 text-center">
                  <DollarSign className="mx-auto mb-2 h-5 w-5 text-primary-500" />
                  <p className="text-2xl font-extrabold text-slate-900">${coursePrice}</p>
                  <p className="text-[11px] font-medium text-slate-500">{t("perSession")}</p>
                </div>
                <div className="rounded-xl bg-primary-50/60 p-4 text-center">
                  <Calendar className="mx-auto mb-2 h-5 w-5 text-primary-500" />
                  <p className="text-2xl font-extrabold text-slate-900">{createdAt}</p>
                  <p className="text-[11px] font-medium text-slate-500">{t("createdAt")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <CourseBookingSection
            locale={locale}
            coursePath={`/${locale}/courses/${id}`}
            tutorId={course.tutor_id}
            subjectId={course.subject_id}
          />

          <div className="lg:hidden">
            <TutorCard
              t={t}
              locale={locale}
              tutorProfile={tutorProfile}
              tutorUser={tutorUser}
              tutorDisplayName={tutorDisplayName}
            />
          </div>

          <Card className="border-violet-100/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold md:text-xl">
                <Star className="h-5 w-5 text-primary-500" />
                {t("reviewsTitle")}
                {reviews.length > 0 && (
                  <span className="text-sm font-medium text-slate-500">({reviews.length})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500 md:text-base">{t("noReviews")}</p>
              ) : (
                <div className="space-y-5 md:space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-violet-100/70 bg-white p-4 md:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-violet-100">
                            <AvatarFallback
                              style={{
                                backgroundColor: getAvatarColor(
                                  review.student?.user?.username ?? "S"
                                ),
                              }}
                              className="text-xs font-semibold text-white"
                            >
                              {(review.student?.user?.username ?? "S").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {review.student?.user?.username ?? t("anonymousStudent")}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(review.created_at).toLocaleDateString(locale, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                      </div>

                      {review.comment && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                      )}

                      {review.tutor_response && (
                        <div className="mt-3 rounded-lg border-l-4 border-primary-500 bg-primary-50/60 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
                            {t("tutorResponse")}
                          </p>
                          <p className="text-sm text-slate-600">{review.tutor_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-24 space-y-6">
            <Card
              data-book-cta-desktop
              className="scroll-mt-28 overflow-hidden border-violet-200/70 bg-white shadow-[0_20px_50px_rgba(112,42,225,0.08)]"
            >
              <div className="bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  {t("pricePerSession")}
                </p>
                <p className="mt-2 text-4xl font-extrabold">${coursePrice}</p>
                <p className="mt-2 text-xs text-white/80">{t("perSession")}</p>
              </div>
              <CardContent className="space-y-3 p-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t("duration")}</span>
                  <span className="font-semibold text-slate-900">
                    {course.duration_minutes} {t("minutes")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t("maxStudentsLabel")}</span>
                  <span className="font-semibold text-slate-900">{course.max_students}</span>
                </div>
                {course.level && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("levelLabel")}</span>
                    <Badge variant="outline" className={levelColors[course.level] ?? ""}>
                      {t(`level.${course.level}`)}
                    </Badge>
                  </div>
                )}

                <Button
                  asChild
                  size="lg"
                  className="mt-5 w-full rounded-full bg-primary-500 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600"
                >
                  <a href="#course-booking" className="inline-flex items-center justify-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    {t("bookClass")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <TutorCard
              t={t}
              locale={locale}
              tutorProfile={tutorProfile}
              tutorUser={tutorUser}
              tutorDisplayName={tutorDisplayName}
            />
          </div>
        </aside>
      </div>

      <div
        data-book-cta-mobile
        className="fixed inset-x-0 bottom-0 z-50 scroll-mt-28 border-t border-violet-100/70 bg-white/90 p-4 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t("pricePerSession")}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">${coursePrice}</p>
          </div>
          <Button
            asChild
            size="lg"
            className="flex-1 rounded-full bg-primary-500 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600"
          >
            <a href="#course-booking" className="inline-flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              {t("bookClass")}
            </a>
          </Button>
        </div>
        <div className="mx-auto mt-2 max-w-2xl">
          <p className="text-center text-[11px] text-slate-500">
            {course.duration_minutes} {t("minutes")} · {t("maxStudents", { count: course.max_students })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──── Tutor Card sub-component ──── */

function TutorCard({
  t,
  locale,
  tutorProfile,
  tutorUser,
  tutorDisplayName,
}: {
  t: Translator;
  locale: string;
  tutorProfile: (TutorProfile & { user: User }) | null;
  tutorUser:
    | { id: string; username: string; email: string; profile_picture?: string | null }
    | null
    | undefined;
  tutorDisplayName: string;
}) {
  return (
    <Card className="border-violet-100/80 bg-white/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-900">{t("aboutTutor")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {tutorUser ? (
            <TutorAvatar user={tutorUser} />
          ) : (
            <Avatar className="h-16 w-16">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">{tutorDisplayName}</h3>
            {tutorProfile && (tutorProfile.rating ?? 0) > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={tutorProfile.rating} size={14} />
                <span className="text-sm text-slate-500">
                  ({tutorProfile.total_reviews} {t("reviews")})
                </span>
              </div>
            )}
          </div>
        </div>

        {tutorProfile?.bio && (
          <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">
            {tutorProfile.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {tutorProfile?.years_of_experience != null && (
            <div className="rounded-xl bg-primary-50/60 p-3 text-center">
              <p className="text-xl font-bold text-slate-900">{tutorProfile.years_of_experience}</p>
              <p className="text-xs text-slate-500">{t("yearsExperience")}</p>
            </div>
          )}
          {tutorProfile?.hourly_rate != null && (
            <div className="rounded-xl bg-primary-50/60 p-3 text-center">
              <p className="text-xl font-bold text-slate-900">${tutorProfile.hourly_rate}</p>
              <p className="text-xs text-slate-500">{t("hourlyRate")}</p>
            </div>
          )}
        </div>

        {(() => {
          const cv = parseCVData(tutorProfile?.certifications ?? null);
          const hasCV =
            cv.education.length > 0 ||
            cv.certifications.length > 0 ||
            cv.experience.length > 0;
          if (!hasCV) return null;
          return (
            <div className="space-y-4 border-t border-violet-100/80 pt-4">
              {cv.education.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
                      <GraduationCap className="h-3.5 w-3.5 text-violet-700" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t("education")}
                    </p>
                  </div>
                  <div className="space-y-1.5 pl-9">
                    {cv.education.map((item) => (
                      <p key={item.id} className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{item.degree}</span>
                        {item.institution ? (
                          <span className="text-slate-400"> · {item.institution}</span>
                        ) : null}
                        {item.year ? <span className="text-slate-400"> · {item.year}</span> : null}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {cv.certifications.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                      <Award className="h-3.5 w-3.5 text-amber-700" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t("certifications")}
                    </p>
                  </div>
                  <div className="space-y-1.5 pl-9">
                    {cv.certifications.map((item) => (
                      <p key={item.id} className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        {item.issuer ? <span className="text-slate-400"> · {item.issuer}</span> : null}
                        {item.year ? <span className="text-slate-400"> · {item.year}</span> : null}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {cv.experience.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                      <Briefcase className="h-3.5 w-3.5 text-emerald-700" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t("teachingExperience")}
                    </p>
                  </div>
                  <div className="space-y-2 pl-9">
                    {cv.experience.map((item) => (
                      <div key={item.id}>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium text-slate-800">{item.role}</span>
                          {item.institution ? (
                            <span className="text-slate-400"> · {item.institution}</span>
                          ) : null}
                          {item.period ? <span className="text-slate-400"> · {item.period}</span> : null}
                        </p>
                        {item.description ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <Button
          asChild
          variant="outline"
          className="w-full border-violet-200 font-semibold text-violet-700 hover:bg-violet-50"
        >
          <Link href={`/${locale}/tutors/${tutorProfile?.id ?? tutorUser?.id ?? ""}`}>
            {t("viewTutorProfile")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  Star,
  BookOpen,
  GraduationCap,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useTranslations, useLocale } from "@/i18n/translations";
import { getCourseWithRelations } from "@/lib/supabase/queries/courses";
import { getTutorProfileWithUser } from "@/lib/supabase/queries/tutors";
import { getReviewsByTutor } from "@/lib/supabase/queries/reviews";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";

import type { CourseWithRelations } from "@/types/course";
import type { TutorProfile } from "@/types/tutor";
import type { User } from "@/types/user";
import type { ReviewWithStudent } from "@/types/review";

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

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("courseDetail");
  const locale = useLocale();

  const [course, setCourse] = useState<CourseWithRelations | null>(null);
  const [tutorProfile, setTutorProfile] = useState<
    (TutorProfile & { user: User }) | null
  >(null);
  const [reviews, setReviews] = useState<ReviewWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);

        const courseData = await getCourseWithRelations(id);
        if (cancelled) return;
        if (!courseData) {
          setCourse(null);
          setLoading(false);
          return;
        }

        setCourse(courseData);

        const [profile, tutorReviews] = await Promise.all([
          getTutorProfileWithUser(courseData.tutor_id),
          getReviewsByTutor(courseData.tutor_id, 10),
        ]);

        if (cancelled) return;
        setTutorProfile(profile);
        setReviews(tutorReviews);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
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

  return (
    <div className="pb-24 md:pb-28 lg:pb-10">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-violet-400/10 to-fuchsia-300/10" />
        <div className="absolute -left-20 top-8 h-44 w-44 rounded-full bg-primary-400/20 blur-3xl" />
        <div className="absolute -right-24 top-12 h-56 w-56 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-10">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 backdrop-blur transition hover:bg-white sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCourses")}
          </Link>

          <div className="mt-5 grid items-end gap-8 md:mt-8 lg:grid-cols-12">
            <div className="space-y-4 md:space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                {course.subject && (
                  <Badge className="rounded-full bg-primary-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-700 hover:bg-primary-100">
                    {course.subject.name}
                  </Badge>
                )}
                {course.level && (
                  <Badge
                    variant="outline"
                    className={`rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${levelColors[course.level] ?? ""}`}
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

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
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
            </div>

            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_20px_60px_rgba(112,42,225,0.12)]">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-500 via-violet-500 to-fuchsia-500 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/80">{t("aboutCourse")}</p>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/95">
                    {course.description}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <Clock className="mx-auto h-4 w-4 text-primary-500" />
                    <p className="mt-1 text-sm font-bold text-slate-900">{course.duration_minutes}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("minutes")}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <Users className="mx-auto h-4 w-4 text-primary-500" />
                    <p className="mt-1 text-sm font-bold text-slate-900">{course.max_students}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("maxStudentsLabel")}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <Calendar className="mx-auto h-4 w-4 text-primary-500" />
                    <p className="mt-1 text-sm font-bold text-slate-900">{createdAt}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("createdAt")}</p>
                  </div>
                </div>
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
            <Card className="overflow-hidden border-violet-200/70 bg-white shadow-[0_20px_50px_rgba(112,42,225,0.08)]">
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
                  <Link href={`/${locale}/student/profile?tab=availabilities`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    {t("bookClass")}
                  </Link>
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

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-100/70 bg-white/90 p-4 backdrop-blur-xl lg:hidden">
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
            <Link href={`/${locale}/student/profile?tab=availabilities`}>
              <Calendar className="mr-2 h-5 w-5" />
              {t("bookClass")}
            </Link>
          </Button>
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
  t: ReturnType<typeof useTranslations>;
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

        {tutorProfile?.certifications && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("certifications")}
            </p>
            <p className="text-sm text-slate-600">
              {tutorProfile.certifications}
            </p>
          </div>
        )}

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

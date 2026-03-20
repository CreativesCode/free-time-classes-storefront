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
    beginner: "bg-green-100 text-green-800 border-green-200",
    intermediate: "bg-blue-100 text-blue-800 border-blue-200",
    advanced: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const tutorDisplayName =
    tutorProfile?.user?.username ?? course.tutor?.username ?? t("unknownTutor");

  const tutorUser = tutorProfile?.user ?? course.tutor;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href={`/${locale}/courses`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToCourses")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ──── Main content (2 cols on desktop) ──── */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {course.subject && (
                <Badge variant="secondary" className="text-xs">
                  {course.subject.name}
                </Badge>
              )}
              {course.level && (
                <Badge
                  variant="outline"
                  className={levelColors[course.level] ?? ""}
                >
                  {t(`level.${course.level}`)}
                </Badge>
              )}
              {!course.is_active && (
                <Badge variant="destructive" className="text-xs">
                  {t("inactive")}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {course.title}
            </h1>

            {/* Quick stats row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {(course.rating ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={course.rating ?? 0} size={14} />
                  <span className="font-medium text-foreground">
                    {(course.rating ?? 0).toFixed(1)}
                  </span>
                  {(course.total_reviews ?? 0) > 0 && (
                    <span>
                      ({course.total_reviews} {t("reviews")})
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.duration_minutes} {t("minutes")}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t("maxStudents", { count: course.max_students })}
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary-500" />
                {t("aboutCourse")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                {course.description}
              </p>
            </CardContent>
          </Card>

          {/* Course details grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary-500" />
                {t("courseInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <Clock className="mx-auto mb-2 h-6 w-6 text-primary-500" />
                  <p className="text-2xl font-bold">{course.duration_minutes}</p>
                  <p className="text-xs text-muted-foreground">{t("minutes")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <Users className="mx-auto mb-2 h-6 w-6 text-primary-500" />
                  <p className="text-2xl font-bold">{course.max_students}</p>
                  <p className="text-xs text-muted-foreground">{t("maxStudentsLabel")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <DollarSign className="mx-auto mb-2 h-6 w-6 text-primary-500" />
                  <p className="text-2xl font-bold">${Number(course.price_per_session).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t("perSession")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <Calendar className="mx-auto mb-2 h-6 w-6 text-primary-500" />
                  <p className="text-2xl font-bold">
                    {new Date(course.created_at).toLocaleDateString(locale, {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("createdAt")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tutor card (visible on mobile, hidden on desktop — desktop uses sidebar) */}
          <div className="lg:hidden">
            <TutorCard
              t={t}
              locale={locale}
              tutorProfile={tutorProfile}
              tutorUser={tutorUser}
              tutorDisplayName={tutorDisplayName}
            />
          </div>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-primary-500" />
                {t("reviewsTitle")}
                {reviews.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({reviews.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  {t("noReviews")}
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback
                              style={{
                                backgroundColor: getAvatarColor(
                                  review.student?.user?.username ?? "S"
                                ),
                              }}
                              className="text-xs text-white font-semibold"
                            >
                              {(review.student?.user?.username ?? "S")
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {review.student?.user?.username ?? t("anonymousStudent")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString(
                                locale,
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                      </div>

                      {review.comment && (
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}

                      {review.tutor_response && (
                        <div className="mt-3 rounded-lg border-l-4 border-primary-500 bg-muted/40 p-3">
                          <p className="mb-1 text-xs font-semibold text-primary-600">
                            {t("tutorResponse")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {review.tutor_response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ──── Sidebar (desktop only) ──── */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {/* Price + CTA */}
            <Card className="overflow-hidden border-primary-500/20">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white">
                <p className="text-sm font-medium opacity-90">{t("pricePerSession")}</p>
                <p className="text-4xl font-extrabold">
                  ${Number(course.price_per_session).toFixed(2)}
                </p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("duration")}</span>
                    <span className="font-medium">
                      {course.duration_minutes} {t("minutes")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("maxStudentsLabel")}</span>
                    <span className="font-medium">{course.max_students}</span>
                  </div>
                  {course.level && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("levelLabel")}</span>
                      <Badge
                        variant="outline"
                        className={levelColors[course.level] ?? ""}
                      >
                        {t(`level.${course.level}`)}
                      </Badge>
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  size="lg"
                  className="mt-6 w-full bg-primary-500 text-white hover:bg-primary-600 text-base font-semibold"
                >
                  <Link href={`/${locale}/student/profile?tab=availabilities`}>
                    <Calendar className="mr-2 h-5 w-5" />
                    {t("bookClass")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Tutor card (desktop sidebar) */}
            <TutorCard
              t={t}
              locale={locale}
              tutorProfile={tutorProfile}
              tutorUser={tutorUser}
              tutorDisplayName={tutorDisplayName}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("pricePerSession")}</p>
            <p className="text-2xl font-extrabold text-primary-600">
              ${Number(course.price_per_session).toFixed(2)}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="flex-1 bg-primary-500 text-white hover:bg-primary-600 font-semibold"
          >
            <Link href={`/${locale}/student/profile?tab=availabilities`}>
              <Calendar className="mr-2 h-5 w-5" />
              {t("bookClass")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom spacer for mobile sticky CTA */}
      <div className="h-24 lg:hidden" />
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("aboutTutor")}</CardTitle>
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
            <h3 className="truncate text-lg font-semibold">{tutorDisplayName}</h3>
            {tutorProfile && (tutorProfile.rating ?? 0) > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={tutorProfile.rating} size={14} />
                <span className="text-sm text-muted-foreground">
                  ({tutorProfile.total_reviews} {t("reviews")})
                </span>
              </div>
            )}
          </div>
        </div>

        {tutorProfile?.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {tutorProfile.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {tutorProfile?.years_of_experience != null && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xl font-bold">{tutorProfile.years_of_experience}</p>
              <p className="text-xs text-muted-foreground">{t("yearsExperience")}</p>
            </div>
          )}
          {tutorProfile?.hourly_rate != null && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xl font-bold">${tutorProfile.hourly_rate}</p>
              <p className="text-xs text-muted-foreground">{t("hourlyRate")}</p>
            </div>
          )}
        </div>

        {tutorProfile?.certifications && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("certifications")}
            </p>
            <p className="text-sm text-muted-foreground">
              {tutorProfile.certifications}
            </p>
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href={`/${locale}/tutors/${tutorProfile?.id ?? tutorUser?.id ?? ""}`}>
            {t("viewTutorProfile")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  DollarSign,
  MapPin,
  Star,
} from "lucide-react";

import { createCatalogServerClient } from "@/lib/supabase/server-public";
import { getCourseCoverPublicUrl, getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import type { TutorProfile } from "@/types/tutor";
import type { User } from "@/types/user";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export const revalidate = 3600;

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

type TutorRow = TutorProfile & { user: User | null; is_active?: boolean | null };

type CourseRow = {
  id: string;
  title: string;
  price_per_session: number;
  cover_image?: string | null;
  subject: { name: string } | null;
};

function mapSubjectRows(
  rows: { subject: unknown }[] | null,
  label: string,
  error: { message?: string } | null
): { id: number; name: string }[] {
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[tutor profile] ${label}:`, error.message ?? error);
    }
    return [];
  }
  return (rows ?? [])
    .map((row) => {
      const s = row.subject as
        | { id: number; name: string }
        | { id: number; name: string }[]
        | null
        | undefined;
      if (!s) return null;
      return Array.isArray(s) ? (s[0] ?? null) : s;
    })
    .filter((s): s is { id: number; name: string } => s != null);
}

function mapCourseRows(
  rows: Record<string, unknown>[] | null,
  label: string,
  error: { message?: string } | null
): CourseRow[] {
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[tutor profile] ${label}:`, error.message ?? error);
    }
    return [];
  }
  return (rows ?? []).map((row) => {
    const sub = row.subject as
      | { name: string }
      | { name: string }[]
      | null
      | undefined;
    const subject =
      !sub ? null : Array.isArray(sub) ? (sub[0] ?? null) : sub;
    return { ...row, subject } as CourseRow;
  });
}

export default async function TutorPublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("tutorPublicProfile");

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    notFound();
  }

  const supabase = createCatalogServerClient();

  const { data: profileData, error: profileError } = await supabase
    .from("tutor_profiles")
    .select(
      `
        *,
        user:users!tutor_profiles_id_fkey (
          id,
          username,
          email,
          profile_picture,
          country
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[tutor profile] tutor_profiles:", profileError.message, profileError);
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg text-muted-foreground">{t("loadError")}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/tutors`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToTutors")}
          </Link>
        </Button>
      </div>
    );
  }

  if (!profileData) {
    notFound();
  }

  const profile = profileData as TutorRow;

  const [subjectsResult, coursesResult] = await Promise.all([
    supabase
      .from("tutor_subjects")
      .select("subject:subjects(id, name)")
      .eq("tutor_id", id),
    supabase
      .from("courses")
      .select(
        `
          id,
          title,
          price_per_session,
          cover_image,
          subject:subjects(name)
        `
      )
      .eq("tutor_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const subjects = mapSubjectRows(
    subjectsResult.data as { subject: unknown }[] | null,
    "tutor_subjects",
    subjectsResult.error
  );
  const courses = mapCourseRows(
    coursesResult.data as Record<string, unknown>[] | null,
    "courses",
    coursesResult.error
  );

  const user = profile.user;
  const displayName = user?.username ?? t("unknownTutor");
  const avatarUrl = user?.profile_picture
    ? getPublicUrl("avatars", user.profile_picture)
    : null;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const rating = profile.rating ?? 0;
  const totalReviews = profile.total_reviews ?? 0;

  return (
    <div className="min-h-screen bg-[#fdf7ff]">
      <section className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-700 via-violet-700 to-fuchsia-600 text-white">
        <div className="pointer-events-none absolute -left-28 top-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Button
            asChild
            variant="ghost"
            className="mb-6 -ml-2 text-white/90 hover:bg-white/10 hover:text-white"
          >
            <Link href={`/${locale}/tutors`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToTutors")}
            </Link>
          </Button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <Avatar className="h-28 w-28 shrink-0 rounded-3xl ring-4 ring-white/30 sm:h-32 sm:w-32">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback
                className="rounded-3xl text-2xl font-bold text-white"
                style={{ backgroundColor: getAvatarColor(displayName) }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {displayName}
              </h1>
              {user?.country ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-violet-100">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {user.country}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StarRating rating={rating} size={18} />
                <span className="text-sm font-semibold text-white">
                  {rating.toFixed(1)}
                </span>
                {totalReviews > 0 ? (
                  <span className="text-sm text-violet-100">
                    ({totalReviews} {t("reviews")})
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {profile.bio ? (
              <Card className="border-violet-100/80 bg-white/95 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {t("about")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {profile.certifications ? (
              <Card className="border-violet-100/80 bg-white/95 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {t("certifications")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {profile.certifications}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-violet-100/80 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {t("coursesHeading")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("noCourses")}</p>
                ) : (
                  <ul className="space-y-3">
                    {courses.map((course) => {
                      const coverUrl = getCourseCoverPublicUrl(course.cover_image);
                      return (
                        <li key={course.id}>
                          <Link
                            href={`/${locale}/courses/${course.id}`}
                            className="flex gap-4 rounded-2xl border border-violet-100/80 bg-violet-50/40 p-3 transition-colors hover:border-violet-200 hover:bg-violet-50/80"
                          >
                            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-violet-100">
                              {coverUrl ? (
                                <Image
                                  src={coverUrl}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                  sizes="112px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <BookOpen className="h-8 w-8 text-violet-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 line-clamp-2">
                                {course.title}
                              </p>
                              {course.subject?.name ? (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {course.subject.name}
                                </p>
                              ) : null}
                              <p className="mt-2 text-sm font-bold text-violet-700">
                                ${Number(course.price_per_session).toFixed(2)}{" "}
                                <span className="font-normal text-slate-500">
                                  {t("perSession")}
                                </span>
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-violet-100/80 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {t("teaches")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <p className="text-sm text-slate-500">{t("noSubjects")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <Badge
                        key={s.id}
                        variant="secondary"
                        className="rounded-full border-violet-100 bg-violet-50 px-3 py-1 text-xs text-violet-700"
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {((profile.years_of_experience != null &&
              profile.years_of_experience > 0) ||
              profile.hourly_rate != null) && (
              <Card className="border-violet-100/80 bg-white/95 shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  {profile.years_of_experience != null &&
                  profile.years_of_experience > 0 ? (
                    <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 p-4">
                      <Clock className="h-5 w-5 text-violet-600" />
                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {profile.years_of_experience}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t("yearsExperience")}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {profile.hourly_rate != null ? (
                    <div className="flex items-center gap-3 rounded-xl bg-primary-50/60 p-4">
                      <DollarSign className="h-5 w-5 text-violet-600" />
                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          ${profile.hourly_rate}
                        </p>
                        <p className="text-xs text-slate-500">{t("hourlyRate")}</p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, BookOpen } from "lucide-react";

import { buildPageMetadata, truncateForMeta } from "@/lib/seo/page-metadata";
import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import { createCatalogServerClient } from "@/lib/supabase/server-public";
import {
  fetchTutorReviewStatsMap,
  mergeTutorProfileReviewStats,
} from "@/lib/supabase/tutor-review-stats";
import { getCourseCoverPublicUrl, getPublicUrl } from "@/lib/supabase/storage";

import type { CourseWithRelations } from "@/types/course";
import type { TutorProfile } from "@/types/tutor";
import { parseCVData } from "@/types/tutor-cv";
import type { User } from "@/types/user";
import type { ReviewWithStudent } from "@/types/review";

import CourseDetailClient from "./CourseDetailClient";

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

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("courseDetail");
  const supabase = createCatalogServerClient();

  let hasError = false;
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

      const [
        { data: profileData, error: profileError },
        { data: reviewsData, error: reviewsError },
        tutorReviewStats,
      ] = await Promise.all([
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

      tutorProfile =
        (profileData as (TutorProfile & { user: User }) | null) ?? null;
      if (tutorProfile) {
        tutorProfile = mergeTutorProfileReviewStats(
          tutorProfile,
          tutorReviewStats
        );
      }
      reviews = (reviewsData as ReviewWithStudent[] | null) ?? [];
    }
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ft-paper px-4">
        <AlertCircle width={36} height={36} className="text-red-600" />
        <p className="text-base text-ft-ink-3">{t("loadError")}</p>
        <Link
          href={`/${locale}/courses`}
          className="inline-flex items-center gap-2 rounded-full border border-ft-line bg-ft-paper px-4 py-2 text-sm font-semibold text-ft-ink transition-colors hover:bg-ft-surface-1"
        >
          <ArrowLeft width={14} height={14} />
          {t("backToCourses")}
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ft-paper px-4">
        <BookOpen width={36} height={36} className="text-ft-ink-3" />
        <h2 className="m-0 text-xl font-semibold text-ft-ink">
          {t("notFound")}
        </h2>
        <p className="text-sm text-ft-ink-3">{t("notFoundDescription")}</p>
        <Link
          href={`/${locale}/courses`}
          className="inline-flex items-center gap-2 rounded-full border border-ft-line bg-ft-paper px-4 py-2 text-sm font-semibold text-ft-ink transition-colors hover:bg-ft-surface-1"
        >
          <ArrowLeft width={14} height={14} />
          {t("backToCourses")}
        </Link>
      </div>
    );
  }

  const createdAtLabel = new Date(course.created_at).toLocaleDateString(
    locale,
    {
      month: "short",
      year: "numeric",
    }
  );
  const coverUrl = getCourseCoverPublicUrl(course.cover_image);

  const tutorUser = tutorProfile?.user ?? course.tutor;
  const tutorAvatar = tutorUser?.profile_picture
    ? tutorUser.profile_picture.startsWith("http")
      ? tutorUser.profile_picture
      : getPublicUrl("avatars", tutorUser.profile_picture)
    : null;

  const cv = parseCVData(tutorProfile?.certifications ?? null);

  const reviewItems = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? null,
    tutor_response: r.tutor_response ?? null,
    created_at: r.created_at,
    studentName: r.student?.user?.username ?? null,
  }));

  return (
    <CourseDetailClient
      locale={locale}
      courseId={id}
      title={course.title}
      description={course.description ?? ""}
      level={course.level ?? null}
      duration_minutes={course.duration_minutes}
      max_students={course.max_students}
      is_active={course.is_active ?? true}
      rating={course.rating ?? 0}
      total_reviews={course.total_reviews ?? 0}
      price_per_session={Number(course.price_per_session)}
      coverUrl={coverUrl}
      createdAtLabel={createdAtLabel}
      subjectName={course.subject?.name ?? null}
      subjectId={course.subject_id ?? null}
      tutorId={course.tutor_id}
      tutor={
        tutorUser
          ? {
              id: tutorUser.id ?? course.tutor_id,
              username: tutorUser.username ?? t("unknownTutor"),
              avatarUrl: tutorAvatar,
              bio: tutorProfile?.bio ?? null,
              years_of_experience: tutorProfile?.years_of_experience ?? null,
              hourly_rate: tutorProfile?.hourly_rate ?? null,
              rating: tutorProfile?.rating ?? 0,
              total_reviews: tutorProfile?.total_reviews ?? 0,
              cv,
            }
          : null
      }
      reviews={reviewItems}
    />
  );
}

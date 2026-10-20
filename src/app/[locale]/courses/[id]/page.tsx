import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";

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

// courses.id is an integer; anything else is a 404 without hitting the DB.
const COURSE_PAGE_ID_RE = /^\d{1,10}$/;

// ISR: rendered on first visit, then cached; revalidateCatalog() refreshes it
// after any catalog change (F053).
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

const COURSE_DETAIL_SELECT = `
  id,
  tutor_id,
  subject_id,
  title,
  description,
  level,
  duration_minutes,
  max_students,
  price_per_session,
  cover_image,
  is_active,
  rating,
  total_reviews,
  created_at,
  updated_at,
  tutor_profile:tutor_profiles!courses_tutor_id_fkey (
    id,
    user:users!tutor_profiles_id_fkey (
      id,
      username,
      profile_picture
    )
  ),
  subject:subjects (
    id,
    name,
    description,
    icon
  )
`;

/** One query per request, shared by generateMetadata and the page. */
const loadActiveCourse = cache(async (id: string) => {
  if (!COURSE_PAGE_ID_RE.test(id)) return { data: null, error: null };
  return createCatalogServerClient()
    .from("courses")
    .select(COURSE_DETAIL_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
});

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

  const { data, error } = await loadActiveCourse(id);

  if (error || !data) {
    return buildPageMetadata({
      locale,
      path: `/courses/${id}`,
      title: t("courseNotFound.title"),
      description: t("courseNotFound.description"),
    });
  }

  const tCourse = await getTranslations({ locale, namespace: "courseDetail" });
  const tp = data.tutor_profile as unknown as
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
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "courseDetail" });
  const supabase = createCatalogServerClient();

  let course: CourseWithRelations | null = null;
  let tutorProfile: (TutorProfile & { user: User }) | null = null;
  let reviews: ReviewWithStudent[] = [];

  // Inactive courses are hidden from the catalog and cannot be booked.
  const { data: courseData, error: courseError } = await loadActiveCourse(id);

  if (courseError) {
    throw courseError;
  }

  if (courseData) {
    const row = courseData as unknown as CourseWithRelations & {
      tutor_profile?: {
        user?: {
          id: string;
          username: string;
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
            id, bio, years_of_experience, certifications, hourly_rate, rating, total_reviews, created_at,
            user:users!tutor_profiles_id_fkey (id, username, profile_picture, country, is_student, is_tutor)
          `
        )
        .eq("id", course.tutor_id)
        .single(),
      supabase
        .from("reviews")
        .select(
          `
            id, rating, comment, tutor_response, created_at,
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
    reviews = (reviewsData as unknown as ReviewWithStudent[] | null) ?? [];
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

import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buildPageMetadata, truncateForMeta } from "@/lib/seo/page-metadata";
import { createCatalogServerClient } from "@/lib/supabase/server-public";
import {
  fetchTutorReviewStatsMap,
  mergeTutorProfileReviewStats,
} from "@/lib/supabase/tutor-review-stats";
import { getCourseCoverPublicUrl, getPublicUrl } from "@/lib/supabase/storage";
import type { TutorProfile } from "@/types/tutor";
import type { User } from "@/types/user";
import { parseCVData } from "@/types/tutor-cv";

import TutorProfileClient from "./TutorProfileClient";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return buildPageMetadata({
      locale,
      path: `/tutors/${id}`,
      title: t("tutorNotFound.title"),
      description: t("tutorNotFound.description"),
    });
  }

  const supabase = createCatalogServerClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      `
      bio,
      user:users!tutor_profiles_id_fkey ( username, profile_picture )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return buildPageMetadata({
      locale,
      path: `/tutors/${id}`,
      title: t("tutorNotFound.title"),
      description: t("tutorNotFound.description"),
    });
  }

  const tProfile = await getTranslations({
    locale,
    namespace: "tutorPublicProfile",
  });
  const rawUser = data.user as
    | { username: string; profile_picture?: string | null }
    | { username: string; profile_picture?: string | null }[]
    | null
    | undefined;
  const user = Array.isArray(rawUser) ? (rawUser[0] ?? null) : rawUser ?? null;
  const name = user?.username ?? tProfile("unknownTutor");
  const excerpt =
    truncateForMeta(data.bio ?? "") || t("tutorExcerptFallback");
  const description = t("tutorDescription", { name, excerpt });
  const title = `${name} · ${t("tutorTitleSuffix")}`;
  const pic = user?.profile_picture
    ? getPublicUrl("avatars", user.profile_picture)
    : undefined;

  return buildPageMetadata({
    locale,
    path: `/tutors/${id}`,
    title,
    titleAbsolute: true,
    description,
    openGraphImages: pic ? [pic] : undefined,
  });
}

type TutorRow = TutorProfile & { user: User | null; is_active?: boolean | null };

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

interface CourseRowRaw {
  id: string;
  title: string;
  price_per_session: number;
  cover_image?: string | null;
  subject: { name: string } | { name: string }[] | null | undefined;
}

function normalizeCourseRows(
  rows: Record<string, unknown>[] | null,
  label: string,
  error: { message?: string } | null
) {
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[tutor profile] ${label}:`, error.message ?? error);
    }
    return [];
  }
  return (rows ?? []).map((row) => {
    const r = row as unknown as CourseRowRaw;
    const sub = r.subject;
    const subject = !sub
      ? null
      : Array.isArray(sub)
        ? (sub[0] ?? null)
        : sub;
    return {
      id: r.id,
      title: r.title,
      price_per_session: Number(r.price_per_session),
      coverUrl: getCourseCoverPublicUrl(r.cover_image),
      subjectName: subject?.name ?? null,
    };
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
      console.error(
        "[tutor profile] tutor_profiles:",
        profileError.message,
        profileError
      );
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ft-paper px-4">
        <p className="text-base text-ft-ink-3">{t("loadError")}</p>
        <Link
          href={`/${locale}/tutors`}
          className="inline-flex items-center gap-2 rounded-full border border-ft-line bg-ft-paper px-4 py-2 text-sm font-semibold text-ft-ink transition-colors hover:bg-ft-surface-1"
        >
          <ArrowLeft width={14} height={14} />
          {t("backToTutors")}
        </Link>
      </div>
    );
  }

  if (!profileData) {
    notFound();
  }

  const tutorReviewStats = await fetchTutorReviewStatsMap(supabase, [id]);
  const profile = mergeTutorProfileReviewStats(
    profileData as TutorRow,
    tutorReviewStats
  );

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
  const courses = normalizeCourseRows(
    coursesResult.data as Record<string, unknown>[] | null,
    "courses",
    coursesResult.error
  );

  const user = profile.user;
  const displayName = user?.username ?? t("unknownTutor");
  const avatarUrl = user?.profile_picture
    ? getPublicUrl("avatars", user.profile_picture)
    : null;

  const cv = parseCVData(profile.certifications);

  return (
    <TutorProfileClient
      locale={locale}
      tutorId={id}
      displayName={displayName}
      bio={profile.bio ?? null}
      country={user?.country ?? null}
      avatarUrl={avatarUrl}
      rating={profile.rating ?? 0}
      totalReviews={profile.total_reviews ?? 0}
      yearsOfExperience={profile.years_of_experience ?? null}
      hourlyRate={profile.hourly_rate ?? null}
      subjects={subjects}
      courses={courses}
      cv={cv}
    />
  );
}

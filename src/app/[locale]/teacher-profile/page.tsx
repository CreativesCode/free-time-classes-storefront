import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import { createClient } from "@/lib/supabase/server";
import {
  fetchTutorReviewStatsMap,
  mergeTutorProfileReviewStats,
} from "@/lib/supabase/tutor-review-stats";
import type { Course, CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import type { TutorProfile } from "@/types/tutor";

import TeacherProfileClient, {
  type TeacherProfilePageUser,
} from "./TeacherProfileClient";

function flattenTutorSubjects(
  data: unknown
): Subject[] {
  const rows = (data ?? []) as {
    subject?: Subject | Subject[] | null;
  }[];
  return rows.flatMap((row) => {
    const s = row.subject;
    if (!s) return [];
    return Array.isArray(s) ? s : [s];
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/teacher-profile",
    title: t("teacherProfile.title"),
    description: t("teacherProfile.description"),
    robots: { index: false, follow: false },
  });
}

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/${locale}/login`);
  }

  const { data: userRow, error: userRowError } = await supabase
    .from("users")
    .select("id, username, email, phone, country, profile_picture, is_tutor")
    .eq("id", authUser.id)
    .single();

  if (userRowError || !userRow) {
    redirect(`/${locale}/login`);
  }

  if (!userRow.is_tutor) {
    redirect(`/${locale}/dashboard`);
  }

  const teacherUser: TeacherProfilePageUser = {
    id: userRow.id,
    username: userRow.username,
    email: userRow.email,
    phone: userRow.phone ?? null,
    country: userRow.country ?? null,
    profile_picture: userRow.profile_picture ?? null,
  };

  const [profileRes, subjectsRes, coursesRes] = await Promise.all([
    supabase.from("tutor_profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("tutor_subjects")
      .select(
        `
        subject:subjects (
          id,
          name,
          description,
          icon,
          created_at,
          updated_at
        )
      `
      )
      .eq("tutor_id", authUser.id),
    supabase
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
      .eq("tutor_id", authUser.id)
      .order("created_at", { ascending: false }),
  ]);

  let initialTutorProfile = (profileRes.data ?? null) as TutorProfile | null;
  if (initialTutorProfile) {
    const reviewStats = await fetchTutorReviewStatsMap(supabase, [authUser.id]);
    initialTutorProfile = mergeTutorProfileReviewStats(
      initialTutorProfile,
      reviewStats
    );
  }
  const initialSubjects = subjectsRes.error
    ? []
    : flattenTutorSubjects(subjectsRes.data);

  let initialCourses: CourseWithRelations[] = [];
  if (!coursesRes.error && coursesRes.data) {
    const rows = coursesRes.data as Array<
      Course & {
        tutor_profile?: {
          user?: {
            id: string;
            username: string;
            email: string;
            profile_picture?: string | null;
          } | null;
        } | null;
        subject?: CourseWithRelations["subject"];
      }
    >;
    initialCourses = rows.map((row) => ({
      ...row,
      tutor: resolveCourseTutorUser(row.tutor_profile),
    })) as CourseWithRelations[];
  }

  return (
    <TeacherProfileClient
      teacherUser={teacherUser}
      initialTutorProfile={initialTutorProfile}
      initialSubjects={initialSubjects}
      initialCourses={initialCourses}
    />
  );
}

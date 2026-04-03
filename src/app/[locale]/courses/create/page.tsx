import { redirect } from "next/navigation";

import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import { createClient } from "@/lib/supabase/server";
import type { Course, CourseWithRelations } from "@/types/course";

import CoursesCreateClient from "./CoursesCreateClient";

export default async function TutorCoursesCreatePage({
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
    .select("is_tutor")
    .eq("id", authUser.id)
    .single();

  if (userRowError || !userRow?.is_tutor) {
    redirect(`/${locale}/dashboard`);
  }

  const { data: coursesData, error: coursesError } = await supabase
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
    .order("created_at", { ascending: false });

  let initialCourses: CourseWithRelations[] = [];
  if (!coursesError && coursesData) {
    const rows = coursesData as Array<
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
    <CoursesCreateClient
      tutorId={authUser.id}
      initialCourses={initialCourses}
    />
  );
}

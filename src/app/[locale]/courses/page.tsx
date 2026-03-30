import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import CoursesPageClient from "./CoursesPageClient";

function CoursesFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

async function CoursesPageContent() {
  const supabase = await createClient();
  const [{ data: subjectsData }, { data: coursesData }] = await Promise.all([
    supabase.from("subjects").select("*").order("name", { ascending: true }),
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
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const initialCourses = ((coursesData ?? []) as Array<
    CourseWithRelations & {
      tutor_profile?: {
        user?: CourseWithRelations["tutor"] | null;
      } | null;
    }
  >).map((row) => ({
    ...row,
    tutor: row.tutor_profile?.user ?? null,
  }));

  return (
    <CoursesPageClient
      initialSubjects={(subjectsData ?? []) as Subject[]}
      initialCourses={initialCourses}
    />
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesFallback />}>
      <CoursesPageContent />
    </Suspense>
  );
}

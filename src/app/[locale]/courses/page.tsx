import type { CourseWithRelations } from "@/types/course";
import type { Subject } from "@/types/subject";
import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import {
  createCatalogServerClient,
  createPublicServerClient,
} from "@/lib/supabase/server-public";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import CoursesPageClient from "./CoursesPageClient";

export const revalidate = 3600;

function CoursesFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

async function CoursesPageContent() {
  const { subjectsData, initialCourses } = await getCoursesPageDataCached();

  return (
    <CoursesPageClient
      initialSubjects={(subjectsData ?? []) as Subject[]}
      initialCourses={initialCourses}
    />
  );
}

const getCoursesPageDataCached = unstable_cache(
  async (): Promise<{
    subjectsData: Subject[];
    initialCourses: CourseWithRelations[];
  }> => {
    const supabase = createPublicServerClient();
    const catalog = createCatalogServerClient();
    const [{ data: subjectsData }, { data: coursesData }] = await Promise.all([
      supabase.from("subjects").select("*").order("name", { ascending: true }),
      catalog
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
      tutor: resolveCourseTutorUser(row.tutor_profile),
    }));

    return {
      subjectsData: (subjectsData ?? []) as Subject[],
      initialCourses,
    };
  },
  ["public-courses-page-v1"],
  { revalidate: 3600, tags: ["courses", "subjects"] }
);

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesFallback />}>
      <CoursesPageContent />
    </Suspense>
  );
}

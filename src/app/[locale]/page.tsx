import HomeContent from "@/components/HomeContent";
import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import { fetchHomeFeaturedTeachers } from "@/lib/supabase/server-queries/home-featured-teachers";
import { createCatalogServerClient } from "@/lib/supabase/server-public";
import type { HomeCourseCard, HomeFeaturedTeacher } from "@/types/home";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";

export const revalidate = 3600;

function HomeFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

async function HomePageContent() {
  const { courses, featuredTeachers } = await getHomePageDataCached();

  return (
    <HomeContent
      initialCourses={courses}
      initialFeaturedTeachers={featuredTeachers}
    />
  );
}

const getHomePageDataCached = unstable_cache(
  async (): Promise<{
    courses: HomeCourseCard[];
    featuredTeachers: HomeFeaturedTeacher[];
  }> => {
    const catalog = createCatalogServerClient();
    const { data } = await catalog
      .from("courses")
      .select(
        `
      id,
      title,
      description,
      level,
      max_students,
      cover_image,
      tutor_profile:tutor_profiles!courses_tutor_id_fkey (
        id,
        user:users!tutor_profiles_id_fkey (
          id,
          username
        )
      )
    `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const courses: HomeCourseCard[] = ((data ?? []) as Array<{
      id: string;
      title: string;
      description: string;
      level: HomeCourseCard["level"];
      max_students: number;
      cover_image?: string | null;
      tutor_profile?: {
        user?: { id: string; username: string } | null;
      } | null;
    }>).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      level: row.level,
      max_students: row.max_students,
      cover_image: row.cover_image ?? null,
      tutor: resolveCourseTutorUser(row.tutor_profile),
    }));

    const featuredTeachers = await fetchHomeFeaturedTeachers(catalog, courses);

    return { courses, featuredTeachers };
  },
  ["public-home-page-v3"],
  { revalidate: 3600, tags: ["courses", "home"] }
);

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageContent />
    </Suspense>
  );
}

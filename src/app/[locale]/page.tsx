import HomeContent from "@/components/HomeContent";
import { createPublicServerClient } from "@/lib/supabase/server-public";
import type { CourseWithRelations } from "@/types/course";
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
  const courses = await getHomeCoursesCached();

  return <HomeContent initialCourses={courses} />;
}

const getHomeCoursesCached = unstable_cache(
  async (): Promise<CourseWithRelations[]> => {
    const supabase = createPublicServerClient();
    const { data } = await supabase
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
      .order("created_at", { ascending: false });

    return ((data ?? []) as Array<
      CourseWithRelations & {
        tutor_profile?: {
          user?: CourseWithRelations["tutor"] | null;
        } | null;
      }
    >).map((row) => ({
      ...row,
      tutor: row.tutor_profile?.user ?? null,
    }));
  },
  ["public-home-courses-v1"],
  { revalidate: 3600, tags: ["courses", "home"] }
);

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageContent />
    </Suspense>
  );
}

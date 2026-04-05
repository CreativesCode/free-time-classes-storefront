import type { Subject } from "@/types/subject";
import {
  fetchTutorReviewStatsMap,
  mergeTutorProfileReviewStats,
} from "@/lib/supabase/tutor-review-stats";
import { createCatalogServerClient } from "@/lib/supabase/server-public";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import TutorsPageClient, { type EnrichedTutor } from "./TutorsPageClient";

export const revalidate = 3600;

interface TutorUser {
  id: string;
  username: string;
  email: string;
  profile_picture: string | null;
  country: string | null;
}

interface TutorProfile {
  id: string;
  bio: string | null;
  experience_years: number | null;
  hourly_rate: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_active: boolean;
  user: TutorUser | null;
}

function TutorsFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

async function TutorsPageContent() {
  const { initialTutors, subjectsData } = await getTutorsPageDataCached();

  return (
    <TutorsPageClient
      initialTutors={initialTutors}
      initialSubjects={(subjectsData ?? []) as Subject[]}
    />
  );
}

const getTutorsPageDataCached = unstable_cache(
  async (): Promise<{ initialTutors: EnrichedTutor[]; subjectsData: Subject[] }> => {
    const supabase = createCatalogServerClient();
    const [{ data: subjectsData }, { data: courseRows, error: coursesError }] =
      await Promise.all([
        supabase.from("subjects").select("*").order("name", { ascending: true }),
        supabase
          .from("courses")
          .select("tutor_id, price_per_session")
          .eq("is_active", true),
      ]);

    if (coursesError && process.env.NODE_ENV === "development") {
      console.error("[tutors page] courses:", coursesError.message, coursesError);
    }

    const courseCountByTutor = new Map<string, number>();
    const minCoursePriceByTutor = new Map<string, number>();
    for (const row of courseRows ?? []) {
      const tid = row.tutor_id as string | null | undefined;
      if (!tid) continue;
      courseCountByTutor.set(tid, (courseCountByTutor.get(tid) ?? 0) + 1);
      const raw = row.price_per_session as number | string | null | undefined;
      const price = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
      if (Number.isFinite(price)) {
        const prev = minCoursePriceByTutor.get(tid);
        if (prev == null || price < prev) minCoursePriceByTutor.set(tid, price);
      }
    }

    const tutorIdsWithCourses = [...courseCountByTutor.keys()];

    if (tutorIdsWithCourses.length === 0) {
      return {
        initialTutors: [],
        subjectsData: (subjectsData ?? []) as Subject[],
      };
    }

    const [{ data: profilesData, error: profilesError }, { data: subjectLinks, error: tsError }] =
      await Promise.all([
        supabase
          .from("tutor_profiles")
          .select(
            `
        *,
        user:users!tutor_profiles_id_fkey (
          id, username, email, profile_picture, country
        )
      `
          )
          .in("id", tutorIdsWithCourses)
          .order("rating", { ascending: false }),
        supabase
          .from("tutor_subjects")
          .select("tutor_id, subject:subjects(id, name)")
          .in("tutor_id", tutorIdsWithCourses),
      ]);

    if (profilesError && process.env.NODE_ENV === "development") {
      console.error("[tutors page] tutor_profiles:", profilesError.message, profilesError);
    }
    if (tsError && process.env.NODE_ENV === "development") {
      console.error("[tutors page] tutor_subjects:", tsError.message, tsError);
    }

    type ProfileRow = TutorProfile & { years_of_experience?: number | null };
    const profiles = (profilesData ?? []) as ProfileRow[];

    const subjectListsByTutorId = new Map<string, { id: number; name: string }[]>();

    for (const row of subjectLinks ?? []) {
      const tid = row.tutor_id as string | null | undefined;
      if (!tid) continue;
      const raw = row.subject as
        | { id: number; name: string }
        | { id: number; name: string }[]
        | null
        | undefined;
      const sub = raw == null ? null : Array.isArray(raw) ? raw[0] : raw;
      if (!sub) continue;
      const list = subjectListsByTutorId.get(tid) ?? [];
      if (!list.some((s) => s.id === sub.id)) {
        list.push(sub);
      }
      subjectListsByTutorId.set(tid, list);
    }

    const reviewStats = await fetchTutorReviewStatsMap(
      supabase,
      tutorIdsWithCourses
    );

    const initialTutors: EnrichedTutor[] = profiles.map((tutor) => {
      const merged = mergeTutorProfileReviewStats(tutor, reviewStats);
      return {
        ...merged,
        experience_years:
          tutor.experience_years ?? tutor.years_of_experience ?? null,
        subjects: subjectListsByTutorId.get(tutor.id) ?? [],
        coursesCount: courseCountByTutor.get(tutor.id) ?? 0,
        min_course_price: minCoursePriceByTutor.get(tutor.id) ?? null,
      };
    });

    return {
      initialTutors,
      subjectsData: (subjectsData ?? []) as Subject[],
    };
  },
  ["public-tutors-page-v5"],
  { revalidate: 3600, tags: ["tutors", "subjects", "courses"] }
);

export default function TutorsPage() {
  return (
    <Suspense fallback={<TutorsFallback />}>
      <TutorsPageContent />
    </Suspense>
  );
}

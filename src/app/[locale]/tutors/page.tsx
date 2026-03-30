import type { Subject } from "@/types/subject";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import TutorsPageClient, { type EnrichedTutor } from "./TutorsPageClient";

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
  const supabase = await createClient();

  const [{ data: subjectsData }, { data: profilesData }] = await Promise.all([
    supabase.from("subjects").select("*").order("name", { ascending: true }),
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
      .eq("is_active", true)
      .order("rating", { ascending: false }),
  ]);

  const profiles = (profilesData ?? []) as TutorProfile[];

  const initialTutors: EnrichedTutor[] = await Promise.all(
    profiles.map(async (tutor) => {
      const [subjectsResult, coursesResult] = await Promise.all([
        supabase
          .from("tutor_subjects")
          .select("subject:subjects(id, name)")
          .eq("tutor_id", tutor.id),
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("tutor_id", tutor.id)
          .eq("is_active", true),
      ]);

      const subjectsList = (subjectsResult.data ?? [])
        .map((row: Record<string, unknown>) => row.subject as { id: number; name: string } | null)
        .filter(Boolean) as { id: number; name: string }[];

      return {
        ...tutor,
        subjects: subjectsList,
        coursesCount: coursesResult.count ?? 0,
      };
    })
  );

  return (
    <TutorsPageClient
      initialTutors={initialTutors}
      initialSubjects={(subjectsData ?? []) as Subject[]}
    />
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<TutorsFallback />}>
      <TutorsPageContent />
    </Suspense>
  );
}

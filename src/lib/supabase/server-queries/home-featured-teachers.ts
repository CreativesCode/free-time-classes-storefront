import type { HomeFeaturedTeacher } from "@/types/home";
import type { SupabaseClient } from "@supabase/supabase-js";

function collectTutorIds(
  courses: Array<{ tutor?: { id: string } | null }>,
  max = 3
): string[] {
  const ids: string[] = [];
  for (const c of courses) {
    const id = c.tutor?.id;
    if (!id || ids.includes(id)) continue;
    ids.push(id);
    if (ids.length >= max) break;
  }
  return ids;
}

export async function fetchHomeFeaturedTeachers(
  supabase: SupabaseClient,
  courses: Array<{ tutor?: { id: string } | null }>
): Promise<HomeFeaturedTeacher[]> {
  const tutorIds = collectTutorIds(courses);
  if (tutorIds.length === 0) return [];

  const rows = await Promise.all(
    tutorIds.map(async (tutorId) => {
      const [{ data: profile, error: profileError }, { data: subjectRows, error: subError }] =
        await Promise.all([
          supabase
            .from("tutor_profiles")
            .select(
              `years_of_experience, user:users!tutor_profiles_id_fkey (username, profile_picture)`
            )
            .eq("id", tutorId)
            .single(),
          supabase
            .from("tutor_subjects")
            .select(`subject:subjects (name)`)
            .eq("tutor_id", tutorId)
            .limit(1),
        ]);

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }
      if (subError) throw subError;

      const user = profile?.user as
        | { username?: string; profile_picture?: string | null }
        | null
        | undefined;
      const row = subjectRows?.[0] as
        | { subject: { name: string } | { name: string }[] | null }
        | undefined;
      const sub = row?.subject;
      const specialty =
        sub == null
          ? "—"
          : Array.isArray(sub)
            ? sub[0]?.name ?? "—"
            : sub.name;

      const coursesCount = courses.filter((c) => c.tutor?.id === tutorId).length;

      return {
        id: tutorId,
        name: user?.username ?? "Profesor",
        specialty,
        yearsOfExperience: profile?.years_of_experience ?? 0,
        coursesCount,
        profilePicture: user?.profile_picture ?? "/images/default-avatar.png",
      } satisfies HomeFeaturedTeacher;
    })
  );

  return rows;
}

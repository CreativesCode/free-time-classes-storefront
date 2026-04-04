import type { HomeFeaturedTeacher } from "@/types/home";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_AVATAR = "/images/default-avatar.png";

function resolveFeaturedTeacherAvatarUrl(
  supabase: SupabaseClient,
  pic: string | null | undefined
): string {
  if (pic == null || typeof pic !== "string") return DEFAULT_AVATAR;
  const trimmed = pic.trim();
  if (!trimmed) return DEFAULT_AVATAR;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(trimmed);
  return publicUrl;
}

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
        profilePicture: resolveFeaturedTeacherAvatarUrl(
          supabase,
          user?.profile_picture
        ),
      } satisfies HomeFeaturedTeacher;
    })
  );

  return rows;
}

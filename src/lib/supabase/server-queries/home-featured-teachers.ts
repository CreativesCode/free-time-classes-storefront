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

  // Batch: 2 queries instead of 2*N
  const [{ data: profiles, error: profilesError }, { data: subjectRows, error: subError }] =
    await Promise.all([
      supabase
        .from("tutor_profiles")
        .select(
          `id, years_of_experience, user:users!tutor_profiles_id_fkey (username, profile_picture)`
        )
        .in("id", tutorIds),
      supabase
        .from("tutor_subjects")
        .select(`tutor_id, subject:subjects (name)`)
        .in("tutor_id", tutorIds),
    ]);

  if (profilesError && profilesError.code !== "PGRST116") {
    throw profilesError;
  }
  if (subError) throw subError;

  // Index profiles by id
  const profileById = new Map<string, (typeof profiles extends (infer R)[] | null ? R : never)>();
  for (const p of profiles ?? []) {
    profileById.set(p.id, p);
  }

  // Index first subject per tutor
  const subjectByTutor = new Map<string, string>();
  for (const row of subjectRows ?? []) {
    const tid = row.tutor_id as string;
    if (tid && !subjectByTutor.has(tid)) {
      const sub = row.subject as { name: string } | { name: string }[] | null;
      const name = sub == null ? null : Array.isArray(sub) ? sub[0]?.name : sub.name;
      if (name) subjectByTutor.set(tid, name);
    }
  }

  return tutorIds.map((tutorId) => {
    const profile = profileById.get(tutorId);
    const user = profile?.user as
      | { username?: string; profile_picture?: string | null }
      | null
      | undefined;
    const coursesCount = courses.filter((c) => c.tutor?.id === tutorId).length;

    return {
      id: tutorId,
      name: user?.username ?? "Profesor",
      specialty: subjectByTutor.get(tutorId) ?? "—",
      yearsOfExperience: profile?.years_of_experience ?? 0,
      coursesCount,
      profilePicture: resolveFeaturedTeacherAvatarUrl(
        supabase,
        user?.profile_picture
      ),
    } satisfies HomeFeaturedTeacher;
  });
}

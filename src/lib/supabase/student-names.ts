import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Usernames of the given students, read from their public `users` row.
 * `student_profiles` is private to its owner, so embeds through it come back
 * null for tutors; a tutor may read the users row of students who booked
 * with them (migration 039).
 */
export async function fetchStudentNames(
  supabase: SupabaseClient,
  studentIds: Array<string | null | undefined>
): Promise<Map<string, string | null>> {
  const ids = [...new Set(studentIds.filter((id): id is string => !!id))];
  if (ids.length === 0) return new Map();
  const { data } = await supabase.from("users").select("id, username").in("id", ids);
  return new Map(
    ((data ?? []) as { id: string; username: string | null }[]).map((u) => [
      u.id,
      u.username || null,
    ])
  );
}

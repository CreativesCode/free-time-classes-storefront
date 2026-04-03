import type { CourseWithRelations } from "@/types/course";

export type TutorUserRow = NonNullable<CourseWithRelations["tutor"]>;

/** Shape returned by various PostgREST selects (partial fields allowed). */
type TutorUserEmbed = Partial<TutorUserRow> &
  Pick<TutorUserRow, "username"> &
  Partial<Pick<TutorUserRow, "id">>;

type TutorProfileEmbed = {
  user?: TutorUserEmbed | TutorUserEmbed[] | null;
} | null | undefined;

/**
 * Resolves tutor user from a course embed (tutor_profiles → users).
 * PostgREST may return `user` as a single object or a one-element array.
 */
export function resolveCourseTutorUser(
  tutorProfile: TutorProfileEmbed
): TutorUserRow | null {
  if (!tutorProfile?.user) return null;
  const u = tutorProfile.user;
  const row = Array.isArray(u) ? u[0] : u;
  if (!row?.username?.trim()) return null;
  return row as TutorUserRow;
}

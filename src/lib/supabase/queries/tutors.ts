import type { Subject } from "@/types/subject";
import type { TutorProfile, TutorSubject } from "@/types/tutor";
import type { User } from "@/types/user";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Get tutor profile by ID
 */
export async function getTutorProfile(id: string): Promise<TutorProfile | null> {
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as TutorProfile;
}

/**
 * Get tutor profile with user data
 */
export type TutorDisplayRow = {
  tutorId: string;
  user: Pick<User, "id" | "username" | "email" | "profile_picture">;
};

/**
 * Datos públicos del tutor para listados (historial, etc.).
 * Parte de `tutor_profiles` y el FK a `users` para no mezclar con el estudiante al anidar desde `lessons`.
 */
export async function getTutorDisplayRowsByIds(
  tutorIds: string[]
): Promise<Record<string, TutorDisplayRow["user"]>> {
  if (tutorIds.length === 0) return {};

  const unique = [...new Set(tutorIds)];
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      `
      id,
      user:users!tutor_profiles_id_fkey (
        id,
        username,
        email,
        profile_picture
      )
    `
    )
    .in("id", unique);

  if (error) throw error;

  const map: Record<string, TutorDisplayRow["user"]> = {};
  for (const row of data || []) {
    const tid = row.id as string;
    const u = row.user as TutorDisplayRow["user"] | null | undefined;
    if (u?.id) {
      map[tid] = {
        id: u.id,
        username: u.username,
        email: u.email,
        profile_picture: u.profile_picture ?? null,
      };
    }
  }
  return map;
}

export async function getTutorProfileWithUser(
  id: string
): Promise<(TutorProfile & { user: User }) | null> {
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      `
      *,
      user:users!tutor_profiles_id_fkey (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as TutorProfile & { user: User };
}

/**
 * Update tutor profile
 */
export async function updateTutorProfile(
  id: string,
  updates: Partial<TutorProfile>
): Promise<TutorProfile> {
  const { data, error } = await supabase
    .from("tutor_profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TutorProfile;
}

/**
 * Get subjects taught by a tutor
 */
export async function getTutorSubjects(tutorId: string): Promise<TutorSubject[]> {
  const { data, error } = await supabase
    .from("tutor_subjects")
    .select("*")
    .eq("tutor_id", tutorId);

  if (error) {
    throw error;
  }

  return (data || []) as TutorSubject[];
}

/**
 * Get detailed subjects taught by a tutor
 */
export async function getTutorSubjectDetails(
  tutorId: string
): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("tutor_subjects")
    .select(
      `
      subject:subjects (
        id,
        name,
        description,
        icon,
        created_at,
        updated_at
      )
    `
    )
    .eq("tutor_id", tutorId);

  if (error) {
    throw error;
  }

  const rows = (data || []) as { subject: Subject[] | null }[];
  return rows
    .flatMap((row) => row.subject || [])
    .filter((subject): subject is Subject => subject !== null);
}

/**
 * Add subject to tutor
 */
export async function addTutorSubject(
  tutorId: string,
  subjectId: number
): Promise<TutorSubject> {
  const { data, error } = await supabase
    .from("tutor_subjects")
    .insert({ tutor_id: tutorId, subject_id: subjectId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TutorSubject;
}

/**
 * Remove subject from tutor
 */
export async function removeTutorSubject(
  tutorId: string,
  subjectId: number
): Promise<void> {
  const { error } = await supabase
    .from("tutor_subjects")
    .delete()
    .eq("tutor_id", tutorId)
    .eq("subject_id", subjectId);

  if (error) {
    throw error;
  }
}

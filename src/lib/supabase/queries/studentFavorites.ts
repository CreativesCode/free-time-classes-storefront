import type { TutorProfile } from "@/types/tutor";
import type { User } from "@/types/user";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Returns tutor ids favorited by a given student.
 */
export async function getFavoriteTutorIds(
  studentId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("student_favorite_tutors")
    .select("tutor_id")
    .eq("student_id", studentId);

  if (error) {
    throw error;
  }

  return (data || []).map((row) => row.tutor_id as string);
}

/**
 * Adds a tutor to favorites.
 * Note: if the favorite already exists, Supabase will throw a constraint error.
 */
export async function addFavoriteTutor(
  studentId: string,
  tutorId: string
): Promise<void> {
  const { error } = await supabase
    .from("student_favorite_tutors")
    .insert({ student_id: studentId, tutor_id: tutorId });

  if (error) {
    throw error;
  }
}

/**
 * Removes a tutor from favorites.
 * Devuelve error si no se borró ninguna fila (RLS, ids incorrectos, etc.).
 */
export async function removeFavoriteTutor(
  studentId: string,
  tutorId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("student_favorite_tutors")
    .delete()
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .select("tutor_id");

  if (error) {
    throw error;
  }
  if (!data?.length) {
    throw new Error(
      "No se eliminó el favorito. Comprueba permisos en Supabase (RLS DELETE en student_favorite_tutors) o vuelve a cargar la página."
    );
  }
}

export type FavoriteTutorWithProfile = TutorProfile & {
  user: User;
  /** tutor_id guardado en student_favorite_tutors (usar en removeFavoriteTutor). */
  favoriteTutorId: string;
};

/**
 * Returns the tutor profiles of a student's favorites in one query (F107).
 * `rating`/`total_reviews` are kept current by the reviews triggers.
 */
export async function getFavoriteTutorsWithProfile(
  studentId: string
): Promise<FavoriteTutorWithProfile[]> {
  const tutorIds = await getFavoriteTutorIds(studentId);
  if (tutorIds.length === 0) return [];

  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      `
      id, bio, years_of_experience, hourly_rate, rating, total_reviews, created_at,
      user:users!tutor_profiles_id_fkey (id, username, profile_picture, country, is_student, is_tutor)
    `
    )
    .in("id", tutorIds);

  if (error) {
    throw error;
  }

  const byId = new Map(
    ((data ?? []) as unknown as (TutorProfile & { user: User })[]).map((row) => [row.id, row])
  );
  // Keep the favorites order; tutors that no longer exist are skipped.
  return tutorIds.flatMap((favoriteTutorId) => {
    const tutor = byId.get(favoriteTutorId);
    return tutor ? [{ ...tutor, favoriteTutorId }] : [];
  });
}

import type { TutorProfile } from "@/types/tutor";
import type { User } from "@/types/user";
import { createClient } from "../client";
import { getTutorProfileWithUser } from "./tutors";

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
 */
export async function removeFavoriteTutor(
  studentId: string,
  tutorId: string
): Promise<void> {
  const { error } = await supabase
    .from("student_favorite_tutors")
    .delete()
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId);

  if (error) {
    throw error;
  }
}

/**
 * Returns full tutor profiles for a student's favorites.
 */
export async function getFavoriteTutorsWithProfile(
  studentId: string
): Promise<(TutorProfile & { user: User })[]> {
  const tutorIds = await getFavoriteTutorIds(studentId);
  const tutors = await Promise.all(
    tutorIds.map((tutorId) => getTutorProfileWithUser(tutorId))
  );

  return tutors.filter(
    (tutor): tutor is TutorProfile & { user: User } => tutor !== null
  );
}


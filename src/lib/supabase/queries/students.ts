import type { StudentProfile } from "@/types/student";
import type { User } from "@/types/user";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Get student profile by ID
 */
export async function getStudentProfile(
  id: string
): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as StudentProfile;
}

/**
 * Get student profile with user data
 */
export async function getStudentProfileWithUser(
  id: string
): Promise<(StudentProfile & { user: User }) | null> {
  const { data, error } = await supabase
    .from("student_profiles")
    .select(
      `
      *,
      user:users!student_profiles_id_fkey (*)
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

  return data as StudentProfile & { user: User };
}

/**
 * Update student profile
 */
export async function updateStudentProfile(
  id: string,
  updates: Partial<StudentProfile>
): Promise<StudentProfile> {
  const { data, error } = await supabase
    .from("student_profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as StudentProfile;
}

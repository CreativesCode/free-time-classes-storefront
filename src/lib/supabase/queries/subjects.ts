import type { Subject, SubjectWithLanguage } from "@/types/subject";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Get all subjects
 */
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as Subject[];
}

/**
 * Get subjects with language information
 */
export async function getSubjectsWithLanguage(): Promise<SubjectWithLanguage[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      *,
      language:languages (
        id,
        name,
        level
      )
    `
    )
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as SubjectWithLanguage[];
}

/**
 * Get subject by ID
 */
export async function getSubject(id: number): Promise<Subject | null> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as Subject;
}

/**
 * Get subject by ID with language
 */
export async function getSubjectWithLanguage(
  id: number
): Promise<SubjectWithLanguage | null> {
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      *,
      language:languages (
        id,
        name,
        level
      )
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

  return data as SubjectWithLanguage;
}

/**
 * Create a new subject
 */
export async function createSubject(
  subjectData: Omit<Subject, "id" | "created_at" | "updated_at">
): Promise<Subject> {
  const { data, error } = await supabase
    .from("subjects")
    .insert(subjectData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Subject;
}

/**
 * Update subject
 */
export async function updateSubject(
  id: number,
  updates: Partial<Omit<Subject, "id" | "created_at">>
): Promise<Subject> {
  const { data, error } = await supabase
    .from("subjects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Subject;
}

/**
 * Delete subject
 */
export async function deleteSubject(id: number): Promise<void> {
  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

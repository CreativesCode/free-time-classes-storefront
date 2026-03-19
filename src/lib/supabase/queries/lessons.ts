import type { Lesson, LessonStatus, LessonWithRelations } from "@/types/lesson";
import { createClient } from "../client";

const supabase = createClient();

export interface LessonFilters {
  status?: LessonStatus;
  scheduled_date_time_gte?: string; // ISO datetime string
  scheduled_date_time_lte?: string; // ISO datetime string
  tutor_id?: string;
  student_id?: string;
  subject_id?: number;
}

/**
 * Get all lessons with optional filters
 */
export async function getLessons(
  filters?: LessonFilters
): Promise<Lesson[]> {
  let query = supabase.from("lessons").select("*");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.scheduled_date_time_gte) {
    query = query.gte("scheduled_date_time", filters.scheduled_date_time_gte);
  }

  if (filters?.scheduled_date_time_lte) {
    query = query.lte("scheduled_date_time", filters.scheduled_date_time_lte);
  }

  if (filters?.tutor_id) {
    query = query.eq("tutor_id", filters.tutor_id);
  }

  if (filters?.student_id) {
    query = query.eq("student_id", filters.student_id);
  }

  if (filters?.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  const { data, error } = await query.order("scheduled_date_time", {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return (data || []) as Lesson[];
}

/**
 * Get lessons with relations (subject, tutor, student)
 */
export async function getLessonsWithRelations(
  filters?: LessonFilters
): Promise<LessonWithRelations[]> {
  let query = supabase
    .from("lessons")
    .select(
      `
      *,
      subject:subjects (
        id,
        name,
        description,
        icon
      ),
      tutor:tutor_profiles!lessons_tutor_id_fkey (
        id,
        user:users!tutor_profiles_id_fkey (
          id,
          username,
          email,
          profile_picture
        )
      ),
      student:student_profiles!lessons_student_id_fkey (
        id,
        user:users!student_profiles_id_fkey (
          id,
          username,
          email
        )
      )
    `
    );

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.scheduled_date_time_gte) {
    query = query.gte("scheduled_date_time", filters.scheduled_date_time_gte);
  }

  if (filters?.scheduled_date_time_lte) {
    query = query.lte("scheduled_date_time", filters.scheduled_date_time_lte);
  }

  if (filters?.tutor_id) {
    query = query.eq("tutor_id", filters.tutor_id);
  }

  if (filters?.student_id) {
    query = query.eq("student_id", filters.student_id);
  }

  if (filters?.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  const { data, error } = await query.order("scheduled_date_time", {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return (data || []) as LessonWithRelations[];
}

/**
 * Get lesson by ID
 */
export async function getLesson(id: number): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as Lesson;
}

/**
 * Get lesson by ID with relations
 */
export async function getLessonWithRelations(
  id: number
): Promise<LessonWithRelations | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
      *,
      subject:subjects (
        id,
        name,
        description,
        icon
      ),
      tutor:tutor_profiles!lessons_tutor_id_fkey (
        id,
        user:users!tutor_profiles_id_fkey (
          id,
          username,
          email,
          profile_picture
        )
      ),
      student:student_profiles!lessons_student_id_fkey (
        id,
        user:users!student_profiles_id_fkey (
          id,
          username,
          email
        )
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

  return data as LessonWithRelations;
}

/**
 * Create a new lesson
 */
export async function createLesson(
  lessonData: Omit<Lesson, "id" | "created_at" | "updated_at">
): Promise<Lesson> {
  const { data, error } = await supabase
    .from("lessons")
    .insert(lessonData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Lesson;
}

/**
 * Update lesson
 */
export async function updateLesson(
  id: number,
  updates: Partial<Omit<Lesson, "id" | "created_at">>
): Promise<Lesson> {
  const { data, error } = await supabase
    .from("lessons")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Lesson;
}

/**
 * Delete lesson
 */
export async function deleteLesson(id: number): Promise<void> {
  const { error } = await supabase.from("lessons").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Lesson status choices (constants, no longer from backend)
 */
export const LESSON_STATUS_CHOICES: Array<{
  value: LessonStatus;
  displayName: string;
}> = [
  { value: "available", displayName: "Available" },
  { value: "scheduled", displayName: "Scheduled" },
  { value: "in_progress", displayName: "In Progress" },
  { value: "completed", displayName: "Completed" },
  { value: "cancelled", displayName: "Cancelled" },
];

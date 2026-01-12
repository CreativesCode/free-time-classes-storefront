import type { Course, CourseWithRelations } from "@/types/course";
import { createClient } from "../client";

const supabase = createClient();

export interface CourseFilters {
  tutor_id?: string;
  subject_id?: number;
  level?: "beginner" | "intermediate" | "advanced";
  is_active?: boolean;
  search?: string; // Search in title or description
}

/**
 * Get all courses with optional filters
 */
export async function getCourses(filters?: CourseFilters): Promise<Course[]> {
  let query = supabase.from("courses").select("*");

  if (filters?.tutor_id) {
    query = query.eq("tutor_id", filters.tutor_id);
  }

  if (filters?.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  if (filters?.level) {
    query = query.eq("level", filters.level);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return (data || []) as Course[];
}

/**
 * Get courses with relations (tutor, subject)
 */
export async function getCoursesWithRelations(
  filters?: CourseFilters
): Promise<CourseWithRelations[]> {
  let query = supabase.from("courses").select(
    `
      *,
      tutor:users!courses_tutor_id_fkey (
        id,
        username,
        email,
        profile_picture
      ),
      subject:subjects (
        id,
        name,
        description,
        icon
      )
    `
  );

  if (filters?.tutor_id) {
    query = query.eq("tutor_id", filters.tutor_id);
  }

  if (filters?.subject_id) {
    query = query.eq("subject_id", filters.subject_id);
  }

  if (filters?.level) {
    query = query.eq("level", filters.level);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return (data || []) as CourseWithRelations[];
}

/**
 * Get course by ID
 */
export async function getCourse(id: number): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as Course;
}

/**
 * Get course by ID with relations
 */
export async function getCourseWithRelations(
  id: number
): Promise<CourseWithRelations | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      *,
      tutor:users!courses_tutor_id_fkey (
        id,
        username,
        email,
        profile_picture
      ),
      subject:subjects (
        id,
        name,
        description,
        icon
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

  return data as CourseWithRelations;
}

/**
 * Create a new course
 */
export async function createCourse(
  courseData: Omit<Course, "id" | "created_at" | "updated_at">
): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .insert(courseData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Course;
}

/**
 * Update course
 */
export async function updateCourse(
  id: number,
  updates: Partial<Omit<Course, "id" | "created_at">>
): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Course;
}

/**
 * Delete course
 */
export async function deleteCourse(id: number): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Get courses by tutor ID
 */
export async function getCoursesByTutor(
  tutorId: string
): Promise<CourseWithRelations[]> {
  return getCoursesWithRelations({ tutor_id: tutorId });
}

/**
 * Get active courses only
 */
export async function getActiveCourses(): Promise<CourseWithRelations[]> {
  return getCoursesWithRelations({ is_active: true });
}

import type { Course, CourseWithRelations } from "@/types/course";
import { resolveCourseTutorUser } from "@/lib/supabase/course-tutor";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../client";

const browserClient = createClient();

export interface CourseFilters {
  tutor_id?: string;
  subject_id?: number;
  level?: "beginner" | "intermediate" | "advanced";
  is_active?: boolean;
  search?: string; // Search in title or description

  // Numeric range filters
  min_price_per_session?: number;
  max_price_per_session?: number;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  min_rating?: number;

  // Sorting
  sort?:
    | "created_desc"
    | "price_asc"
    | "price_desc"
    | "duration_asc"
    | "duration_desc";
}

/**
 * Get all courses with optional filters
 */
export async function getCourses(filters?: CourseFilters): Promise<Course[]> {
  let query = browserClient.from("courses").select("*");

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

  if (filters?.min_price_per_session !== undefined) {
    query = query.gte("price_per_session", filters.min_price_per_session);
  }
  if (filters?.max_price_per_session !== undefined) {
    query = query.lte("price_per_session", filters.max_price_per_session);
  }

  if (filters?.min_duration_minutes !== undefined) {
    query = query.gte("duration_minutes", filters.min_duration_minutes);
  }
  if (filters?.max_duration_minutes !== undefined) {
    query = query.lte("duration_minutes", filters.max_duration_minutes);
  }

  if (filters?.min_rating !== undefined) {
    query = query.gte("rating", filters.min_rating);
  }

  const sort = filters?.sort ?? "created_desc";
  const { data, error } =
    sort === "price_asc"
      ? await query.order("price_per_session", { ascending: true })
      : sort === "price_desc"
        ? await query.order("price_per_session", { ascending: false })
        : sort === "duration_asc"
          ? await query.order("duration_minutes", { ascending: true })
          : sort === "duration_desc"
            ? await query.order("duration_minutes", { ascending: false })
            : await query.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as Course[];
}

/**
 * Get courses with relations (tutor, subject)
 */
export async function getCoursesWithRelations(
  filters?: CourseFilters,
  client: SupabaseClient = browserClient
): Promise<CourseWithRelations[]> {
  let query = client.from("courses").select(
    `
      *,
      tutor_profile:tutor_profiles!courses_tutor_id_fkey (
        id,
        user:users!tutor_profiles_id_fkey (
          id,
          username,
          email,
          profile_picture
        )
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

  if (filters?.min_price_per_session !== undefined) {
    query = query.gte("price_per_session", filters.min_price_per_session);
  }
  if (filters?.max_price_per_session !== undefined) {
    query = query.lte("price_per_session", filters.max_price_per_session);
  }

  if (filters?.min_duration_minutes !== undefined) {
    query = query.gte("duration_minutes", filters.min_duration_minutes);
  }
  if (filters?.max_duration_minutes !== undefined) {
    query = query.lte("duration_minutes", filters.max_duration_minutes);
  }

  if (filters?.min_rating !== undefined) {
    query = query.gte("rating", filters.min_rating);
  }

  const sort = filters?.sort ?? "created_desc";
  const { data, error } =
    sort === "price_asc"
      ? await query.order("price_per_session", { ascending: true })
      : sort === "price_desc"
        ? await query.order("price_per_session", { ascending: false })
        : sort === "duration_asc"
          ? await query.order("duration_minutes", { ascending: true })
          : sort === "duration_desc"
            ? await query.order("duration_minutes", { ascending: false })
            : await query.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data || []) as Array<
    Course & {
      tutor_profile?: {
        user?: {
          id: string;
          username: string;
          email: string;
          profile_picture?: string | null;
        } | null;
      } | null;
      subject?: CourseWithRelations["subject"];
    }
  >;

  return rows.map((row) => ({
    ...row,
    tutor: resolveCourseTutorUser(row.tutor_profile),
  })) as CourseWithRelations[];
}

/**
 * Get course by ID
 */
export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await browserClient
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
  id: string
): Promise<CourseWithRelations | null> {
  const { data, error } = await browserClient
    .from("courses")
    .select(
      `
      *,
      tutor_profile:tutor_profiles!courses_tutor_id_fkey (
        id,
        user:users!tutor_profiles_id_fkey (
          id,
          username,
          email,
          profile_picture
        )
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

  const row = data as Course & {
    tutor_profile?: {
      user?: {
        id: string;
        username: string;
        email: string;
        profile_picture?: string | null;
      } | null;
    } | null;
    subject?: CourseWithRelations["subject"];
  };

  return {
    ...row,
    tutor: resolveCourseTutorUser(row.tutor_profile),
  } as CourseWithRelations;
}

/**
 * Create a new course
 */
export async function createCourse(
  courseData: Omit<Course, "id" | "created_at" | "updated_at">
): Promise<Course> {
  const { data, error } = await browserClient
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
  id: string,
  updates: Partial<Omit<Course, "id" | "created_at">>
): Promise<Course> {
  const { data, error } = await browserClient
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
export async function deleteCourse(id: string): Promise<void> {
  const { error } = await browserClient.from("courses").delete().eq("id", id);

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

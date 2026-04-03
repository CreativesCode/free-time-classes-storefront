import type { Subject } from "./subject";

// Course type matching Supabase courses table
export interface Course {
  id: string; // UUID primary key
  title: string;
  description: string;
  tutor_id: string; // References users(id)
  subject_id?: number | null; // References subjects(id)
  /** Ruta en el bucket course_covers (p. ej. {id}/archivo.jpg) o URL absoluta legacy */
  cover_image?: string | null;
  price_per_session: number; // numeric(10,2)
  duration_minutes: number; // Integer - total course duration in minutes
  max_students: number; // Integer
  level?: "beginner" | "intermediate" | "advanced" | null;
  rating?: number; // float4, default 0
  total_reviews?: number; // int, default 0
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Course with relations for queries
export interface CourseWithRelations extends Course {
  tutor?: {
    id: string;
    username: string;
    email: string;
    profile_picture?: string | null;
  } | null;
  subject?: Subject | null;
  enrolled_students_count?: number;
}

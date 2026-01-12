import type { Subject } from "./subject";
import type { User } from "./user";

// Course type matching Supabase courses table
export interface Course {
  id: number; // Serial primary key
  title: string;
  description: string;
  tutor_id: string; // References users(id)
  subject_id?: number | null; // References subjects(id)
  price: number; // Decimal
  duration_hours: number; // Integer - total course duration in hours
  max_students: number; // Integer
  level?: "beginner" | "intermediate" | "advanced" | null;
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

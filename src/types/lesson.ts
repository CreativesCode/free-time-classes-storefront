// Lesson type matching Supabase lessons table
export type LessonStatus =
  | "available"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Lesson {
  id: number; // Serial primary key
  tutor_id: string; // UUID, references tutor_profiles(id)
  student_id?: string | null; // UUID, references student_profiles(id)
  subject_id: number; // References subjects(id)
  price: number; // numeric(10,2), default 0.00
  scheduled_date_time?: string | null; // Timestamp
  duration_minutes: number; // int, check >= 30
  status: LessonStatus; // default 'available'
  meet_link?: string | null; // Video call URL set by tutor when confirming
  /** Set when this slot was generated from a recurring weekly rule */
  availability_rule_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Lesson with joined relations (for queries with select)
export interface LessonWithRelations extends Lesson {
  subject?: {
    id: number;
    name: string;
    description?: string | null;
    icon?: string | null;
    language?: {
      id: number;
      name: string;
      level?: string | null;
    } | null;
  } | null;
  tutor?: {
    id: string;
    user?: {
      id: string;
      username: string;
      email: string;
      profile_picture?: string | null;
    } | null;
  } | null;
  student?: {
    id: string;
    user?: {
      id: string;
      username: string;
      email: string;
    } | null;
  } | null;
}

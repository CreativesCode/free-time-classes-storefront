// Student profile type matching Supabase student_profiles table
export interface StudentProfile {
  id: string; // UUID, references users(id)
  bio?: string | null;
  language_level?:
    | "beginner"
    | "elementary"
    | "intermediate"
    | "upper_intermediate"
    | "advanced"
    | "proficient"
    | null;
  learning_goals?: string | null;
  prefers_audio_calls: boolean;
  prefers_video_calls: boolean;
  prefers_text_chat: boolean;
  timezone?: string | null;
  preferred_schedules?: Record<string, unknown> | null; // JSONB
  created_at: string;
}

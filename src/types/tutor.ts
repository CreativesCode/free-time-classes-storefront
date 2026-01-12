// Tutor profile type matching Supabase tutor_profiles table
export interface TutorProfile {
  id: string; // UUID, references users(id)
  bio?: string | null;
  years_of_experience?: number | null;
  certifications?: string | null;
  languages_spoken?: Record<string, any> | null; // JSONB
  hourly_rate?: number | null; // numeric(6,2)
  availability?: Record<string, any> | null; // JSONB
  timezone?: string | null;
  rating: number; // float4, default 0
  total_reviews: number; // default 0
  created_at: string;
}

// Tutor subject relation type
export interface TutorSubject {
  tutor_id: string; // UUID
  subject_id: number; // References subjects(id)
}

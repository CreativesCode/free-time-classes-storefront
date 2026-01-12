// Language type matching Supabase languages table
export type LanguageLevel =
  | "beginner"
  | "elementary"
  | "intermediate"
  | "upper_intermediate"
  | "advanced"
  | "proficient"
  | "hsk1"
  | "hsk2"
  | "hsk3"
  | "hsk4"
  | "hsk5"
  | "hsk6";

export interface Language {
  id: number; // Serial primary key
  name: string; // Unique
  level?: LanguageLevel | null;
  created_at: string;
  updated_at: string;
}

// Subject type matching Supabase subjects table
export interface Subject {
  id: number; // Serial primary key
  name: string; // Unique
  language_id?: number | null; // References languages(id)
  description?: string | null;
  icon?: string | null; // Path in storage/subject_icons/
  created_at: string;
  updated_at: string;
}

// Subject with joined language (for queries with select)
export interface SubjectWithLanguage extends Subject {
  language?: Language | null;
}

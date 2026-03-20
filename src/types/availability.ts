export type TutorAvailabilityRule = {
  id: string;
  tutor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at?: string;
};

export type AvailabilityException = {
  id: string;
  tutor_id: string;
  exception_date: string;
  start_time: string | null;
  end_time: string | null;
  type: "blocked" | "extra";
  reason: string | null;
  subject_id: number | null;
  duration_minutes: number | null;
  price: number | null;
  created_at?: string;
};

export type GeneratedLessonSlot = {
  scheduled_date_time: string;
  subject_id: number;
  duration_minutes: number;
  price: number;
};

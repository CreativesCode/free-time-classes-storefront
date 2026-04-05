export interface Review {
  id: string; // uuid
  booking_id: number | null;
  /** Reseña sin reserva: solo `lesson_id` (mutuamente excluyente con booking_id en DB). */
  lesson_id?: number | null;
  student_id: string;
  tutor_id: string;
  course_id?: string | null;
  rating: number;
  comment: string | null;
  tutor_response?: string | null;
  created_at: string;
}

export type ReviewWithStudent = Review & {
  student?: {
    id: string;
    user?: {
      id: string;
      username?: string | null;
      profile_picture?: string | null;
    } | null;
  };
};


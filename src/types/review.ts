export interface Review {
  id: string; // uuid
  booking_id: number;
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


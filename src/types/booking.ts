// Booking type matching Supabase bookings table
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export interface Booking {
  id: number; // Serial primary key
  student_id: string; // UUID, references student_profiles(id)
  tutor_id: string; // UUID, references tutor_profiles(id)
  lesson_id?: number | null; // References lessons(id)
  requested_date?: string | null; // Timestamp
  status: BookingStatus; // default 'pending'
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Booking rejection type
export type BookingRejectionReason =
  | "tutor unavailable"
  | "sick tutor"
  | "sick student"
  | "scheduling conflict"
  | "emergency"
  | "technical issues"
  | "other";

export interface BookingRejection {
  id: number; // Serial primary key
  booking_id: number; // References bookings(id)
  student_id: string; // UUID
  tutor_id: string; // UUID
  reason: BookingRejectionReason;
  created_at: string;
}

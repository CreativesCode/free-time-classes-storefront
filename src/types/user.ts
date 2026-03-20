// User type matching Supabase public.users table
export interface User {
  id: string; // UUID
  username: string;
  email: string;
  phone?: string | null;
  profile_picture?: string | null; // Path in storage/avatars/
  date_of_birth?: string | null; // ISO date string
  country?: string | null;
  is_student: boolean;
  is_tutor: boolean;
  receive_email_notifications: boolean;
  receive_sms_notifications: boolean;
  profile_visibility?: "public" | "booking_only" | string | null;
  created_at: string;
  updated_at: string;
}

import type { Booking, BookingRejection } from "@/types/booking";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Get bookings by student ID
 */
export async function getBookingsByStudent(
  studentId: string
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as Booking[];
}

/**
 * Get bookings by tutor ID
 */
export async function getBookingsByTutor(tutorId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as Booking[];
}

/**
 * Get completed bookings for a student filtered by lesson IDs.
 * Used to map completed lessons to booking IDs (to attach a review).
 */
export async function getCompletedBookingsByStudentAndLessonIds(
  studentId: string,
  lessonIds: number[]
): Promise<Booking[]> {
  if (lessonIds.length === 0) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("id, lesson_id, tutor_id, student_id, status, created_at, updated_at")
    .eq("student_id", studentId)
    // En esta app, a veces el estado "finalizado" se refleja como `confirmed`
    // mientras que `lessons.status` es el que indica completitud.
    // Permitimos ambos para que el historial mapee la reseña correctamente.
    .in("status", ["completed", "confirmed"])
    .in("lesson_id", lessonIds);

  if (error) throw error;
  return (data || []) as Booking[];
}

/**
 * Get booking by ID
 */
export async function getBooking(id: number): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as Booking;
}

/**
 * Create a new booking
 */
export async function createBooking(
  bookingData: Omit<Booking, "id" | "created_at" | "updated_at">
): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .insert(bookingData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Booking;
}

/**
 * Update booking
 */
export async function updateBooking(
  id: number,
  updates: Partial<Omit<Booking, "id" | "created_at">>
): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Booking;
}

/**
 * Delete booking
 */
export async function deleteBooking(id: number): Promise<void> {
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Create booking rejection
 */
export async function createBookingRejection(
  rejectionData: Omit<BookingRejection, "id" | "created_at">
): Promise<BookingRejection> {
  const { data, error } = await supabase
    .from("booking_rejections")
    .insert(rejectionData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as BookingRejection;
}

/**
 * Get booking rejections by booking ID
 */
export async function getBookingRejections(
  bookingId: number
): Promise<BookingRejection[]> {
  const { data, error } = await supabase
    .from("booking_rejections")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as BookingRejection[];
}

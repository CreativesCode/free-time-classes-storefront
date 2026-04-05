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

/** Estados que siempre permiten reseña (coincide con RLS en Supabase, salvo excepción `pending`). */
export const BOOKING_STATUSES_ELIGIBLE_FOR_REVIEW: Booking["status"][] = [
  "completed",
  "confirmed",
];

/**
 * Coincide con la política `reviews_student_insert` (incl. pending si la lección está completada).
 */
export function isBookingStatusEligibleForReview(
  status: Booking["status"],
  options?: { lessonCompleted?: boolean }
): boolean {
  if (BOOKING_STATUSES_ELIGIBLE_FOR_REVIEW.includes(status)) return true;
  if (options?.lessonCompleted && status === "pending") return true;
  return false;
}

/**
 * Todas las reservas del estudiante vinculadas a las lecciones indicadas (cualquier estado).
 * El filtrado por estado elegible para reseña se hace en el cliente para manejar varias
 * reservas por lección y no perder filas por restricciones demasiado estrechas en SQL.
 */
export async function getBookingsByStudentAndLessonIds(
  studentId: string,
  lessonIds: number[]
): Promise<Booking[]> {
  if (lessonIds.length === 0) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("id, lesson_id, tutor_id, student_id, status, created_at, updated_at")
    .eq("student_id", studentId)
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

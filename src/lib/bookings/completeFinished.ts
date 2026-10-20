import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addMinutesToLessonTimestamp,
  nowAsLessonTimestamp,
} from "@/lib/datetime/lessonTime";

export interface CompleteFinishedResult {
  bookingsCompleted: number;
  error?: string;
}

/**
 * Marks confirmed bookings (and their lessons) as completed once the class
 * has ended in Madrid wall-clock time. Idempotent; run from the daily cron.
 */
export async function completeFinishedBookings(
  admin: SupabaseClient
): Promise<CompleteFinishedResult> {
  const now = nowAsLessonTimestamp();

  // Only classes that already started can have ended.
  const { data: rows, error } = await admin
    .from("bookings")
    .select("id, lesson_id, lesson:lessons!inner(id, scheduled_date_time, duration_minutes)")
    .eq("status", "confirmed")
    .lt("lesson.scheduled_date_time", now);

  if (error) return { bookingsCompleted: 0, error: error.message };

  const finished = (rows || []).filter((row) => {
    const lesson = (Array.isArray(row.lesson) ? row.lesson[0] : row.lesson) as
      | { scheduled_date_time: string; duration_minutes: number }
      | null;
    if (!lesson?.scheduled_date_time) return false;
    const end = addMinutesToLessonTimestamp(
      String(lesson.scheduled_date_time).replace(" ", "T"),
      lesson.duration_minutes ?? 0
    );
    return end <= now;
  });

  if (finished.length === 0) return { bookingsCompleted: 0 };

  const bookingIds = finished.map((row) => row.id as number);
  const lessonIds = finished
    .map((row) => row.lesson_id as number | null)
    .filter((id): id is number => typeof id === "number");
  const updatedAt = new Date().toISOString();

  const { error: bookingError } = await admin
    .from("bookings")
    .update({ status: "completed", updated_at: updatedAt })
    .in("id", bookingIds)
    .eq("status", "confirmed");
  if (bookingError) return { bookingsCompleted: 0, error: bookingError.message };

  if (lessonIds.length > 0) {
    const { error: lessonError } = await admin
      .from("lessons")
      .update({ status: "completed", updated_at: updatedAt })
      .in("id", lessonIds)
      .eq("status", "scheduled");
    if (lessonError) {
      return { bookingsCompleted: bookingIds.length, error: lessonError.message };
    }
  }

  return { bookingsCompleted: bookingIds.length };
}

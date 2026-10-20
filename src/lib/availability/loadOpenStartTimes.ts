import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BOOKING_HORIZON_WEEKS,
  computeOpenStartTimes,
  type AvailabilityWindowException,
  type AvailabilityWindowRule,
  type BusyInterval,
} from "@/lib/availability/openStartTimes";
import { MIN_LEAD_MINUTES } from "@/lib/bookings/leadTime";
import {
  addMinutesToLessonTimestamp,
  nowAsLessonTimestamp,
  nowPlusMinutesAsLessonTimestamp,
} from "@/lib/datetime/lessonTime";

/** Longest class allowed; bounds the lookback for classes that overlap the range. */
const MAX_LESSON_MINUTES = 240;

export type BookableCourse = {
  id: number;
  tutor_id: string;
  subject_id: number | null;
  title: string;
  duration_minutes: number;
  price_per_session: number;
};

/** Today and the last bookable day (Madrid), as `YYYY-MM-DD`. */
export function bookingWindowDates(): { today: string; lastDay: string } {
  const today = nowAsLessonTimestamp().slice(0, 10);
  const lastDay = addMinutesToLessonTimestamp(
    `${today}T00:00:00`,
    BOOKING_HORIZON_WEEKS * 7 * 24 * 60
  ).slice(0, 10);
  return { today, lastDay };
}

/** Active course with the fields booking needs, or null. */
export async function loadBookableCourse(
  admin: SupabaseClient,
  courseId: number
): Promise<BookableCourse | null> {
  const { data } = await admin
    .from("courses")
    .select("id, tutor_id, subject_id, title, duration_minutes, price_per_session, is_active")
    .eq("id", courseId)
    .maybeSingle();
  if (!data || !data.is_active || !data.tutor_id || !data.duration_minutes) return null;
  return {
    id: data.id as number,
    tutor_id: data.tutor_id as string,
    subject_id: (data.subject_id as number | null) ?? null,
    title: data.title as string,
    duration_minutes: data.duration_minutes as number,
    price_per_session: Number(data.price_per_session),
  };
}

/**
 * Open start times (Madrid wall-clock) for `course` between two dates,
 * clamped to [today, today + horizon] and to the minimum booking lead.
 */
export async function loadOpenStartTimes(
  admin: SupabaseClient,
  course: BookableCourse,
  range: { fromDate?: string; toDate?: string } = {}
): Promise<string[]> {
  const { today, lastDay } = bookingWindowDates();
  const fromDate = range.fromDate && range.fromDate > today ? range.fromDate : today;
  const toDate = range.toDate && range.toDate < lastDay ? range.toDate : lastDay;
  if (fromDate > toDate) return [];

  const [rulesRes, exceptionsRes, busyRes] = await Promise.all([
    admin
      .from("tutor_availability")
      .select("day_of_week, start_time, end_time, is_active")
      .eq("tutor_id", course.tutor_id)
      .eq("is_active", true),
    admin
      .from("availability_exceptions")
      .select("exception_date, start_time, end_time, type")
      .eq("tutor_id", course.tutor_id)
      .gte("exception_date", fromDate)
      .lte("exception_date", toDate),
    admin
      .from("lessons")
      .select("scheduled_date_time, duration_minutes")
      .eq("tutor_id", course.tutor_id)
      .in("status", ["scheduled", "in_progress"])
      .gte(
        "scheduled_date_time",
        addMinutesToLessonTimestamp(`${fromDate}T00:00:00`, -MAX_LESSON_MINUTES)
      )
      .lte("scheduled_date_time", `${toDate}T23:59:59`),
  ]);

  if (rulesRes.error || exceptionsRes.error || busyRes.error) {
    throw new Error("Failed to load the tutor's availability.");
  }

  return computeOpenStartTimes({
    rules: (rulesRes.data ?? []) as AvailabilityWindowRule[],
    exceptions: (exceptionsRes.data ?? []) as AvailabilityWindowException[],
    busy: (busyRes.data ?? []) as BusyInterval[],
    durationMinutes: course.duration_minutes,
    fromDate,
    toDate,
    minStart: nowPlusMinutesAsLessonTimestamp(MIN_LEAD_MINUTES),
  });
}

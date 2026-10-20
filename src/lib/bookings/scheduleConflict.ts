import type { SupabaseClient } from "@supabase/supabase-js";
import { addMinutesToLessonTimestamp } from "@/lib/datetime/lessonTime";

// Longest lesson the app allows; bounds the lookback window for overlaps.
const MAX_LESSON_MINUTES = 240;

export type ScheduleConflict = "tutor_busy" | "student_busy" | null;

type LessonWindow = {
  id: number;
  scheduled_date_time: string;
  duration_minutes: number | null;
};

function overlaps(rows: LessonWindow[], start: string, end: string): boolean {
  return rows.some((row) => {
    const rowStart = String(row.scheduled_date_time).replace(" ", "T").slice(0, 19);
    const rowEnd = addMinutesToLessonTimestamp(rowStart, row.duration_minutes ?? 0);
    return rowStart < end && rowEnd > start;
  });
}

/**
 * Checks whether a class at `start` (Madrid wall-clock) for `durationMinutes`
 * collides with a class the tutor or the student already committed to
 * (lessons in `scheduled` state). Free slots (`available`) never conflict.
 */
export async function findScheduleConflict(
  admin: SupabaseClient,
  args: {
    tutorId: string;
    studentId: string;
    start: string;
    durationMinutes: number;
    excludeLessonId?: number;
  }
): Promise<ScheduleConflict> {
  const start = args.start.replace(" ", "T").slice(0, 19);
  const end = addMinutesToLessonTimestamp(start, args.durationMinutes);
  const lookback = addMinutesToLessonTimestamp(start, -MAX_LESSON_MINUTES);

  const load = async (column: "tutor_id" | "student_id", id: string) => {
    let query = admin
      .from("lessons")
      .select("id, scheduled_date_time, duration_minutes")
      .eq(column, id)
      .eq("status", "scheduled")
      .gt("scheduled_date_time", lookback)
      .lt("scheduled_date_time", end);
    if (args.excludeLessonId !== undefined) {
      query = query.neq("id", args.excludeLessonId);
    }
    const { data } = await query;
    return (data || []) as LessonWindow[];
  };

  const [tutorLessons, studentLessons] = await Promise.all([
    load("tutor_id", args.tutorId),
    load("student_id", args.studentId),
  ]);

  if (overlaps(tutorLessons, start, end)) return "tutor_busy";
  if (overlaps(studentLessons, start, end)) return "student_busy";
  return null;
}

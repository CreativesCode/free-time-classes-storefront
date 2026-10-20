import { nowPlusMinutesAsLessonTimestamp } from "@/lib/datetime/lessonTime";

/** Minimum notice (hours) a student needs to cancel a confirmed class. */
export const STUDENT_CANCEL_HOURS = 24;

/**
 * Whether a confirmed class starting at `scheduledDateTime` (Madrid
 * wall-clock) is still outside the no-cancellation window.
 */
export function canStudentCancelConfirmed(
  scheduledDateTime: string | null | undefined
): boolean {
  if (!scheduledDateTime) return false;
  const start = String(scheduledDateTime).replace(" ", "T").slice(0, 19);
  return start >= nowPlusMinutesAsLessonTimestamp(STUDENT_CANCEL_HOURS * 60);
}

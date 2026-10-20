import type { SupabaseClient } from "@supabase/supabase-js";
import { nowAsLessonTimestamp } from "@/lib/datetime/lessonTime";
import type { AvailabilityException } from "@/types/availability";

function minutesOfDay(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map((x) => parseInt(x, 10));
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Frees a lesson after its booking is cancelled or rejected.
 *
 * The slot is only put back on sale when its origin is still valid: the
 * weekly rule exists and is active (or the "extra" exception that created it
 * still exists), the day is not blocked and the class is in the future.
 * Lessons created for a custom request, or whose origin is gone, are
 * cancelled instead of republished.
 */
export async function releaseLesson(
  admin: SupabaseClient,
  lessonId: number,
  options: { isCustomRequest: boolean }
): Promise<"available" | "cancelled"> {
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, tutor_id, scheduled_date_time, duration_minutes, availability_rule_id")
    .eq("id", lessonId)
    .single();

  let reopen = false;

  if (lesson && !options.isCustomRequest) {
    const start = String(lesson.scheduled_date_time).replace(" ", "T").slice(0, 19);
    const dateKey = start.slice(0, 10);
    const startMin = minutesOfDay(start.slice(11, 16));
    const endMin = startMin + (lesson.duration_minutes ?? 0);

    const { data: exceptionRows } = await admin
      .from("availability_exceptions")
      .select("*")
      .eq("tutor_id", lesson.tutor_id)
      .eq("exception_date", dateKey);
    const exceptions = (exceptionRows || []) as AvailabilityException[];

    const covers = (ex: AvailabilityException) =>
      ex.start_time == null ||
      ex.end_time == null ||
      (startMin < minutesOfDay(ex.end_time) && endMin > minutesOfDay(ex.start_time));

    const blocked = exceptions.some((ex) => ex.type === "blocked" && covers(ex));

    let originValid = false;
    if (lesson.availability_rule_id) {
      const { data: rule } = await admin
        .from("tutor_availability")
        .select("is_active")
        .eq("id", lesson.availability_rule_id)
        .maybeSingle();
      originValid = Boolean(rule?.is_active);
    } else {
      originValid = exceptions.some(
        (ex) =>
          ex.type === "extra" &&
          ex.start_time != null &&
          ex.end_time != null &&
          startMin >= minutesOfDay(ex.start_time) &&
          endMin <= minutesOfDay(ex.end_time)
      );
    }

    reopen = originValid && !blocked && start > nowAsLessonTimestamp();
  }

  const status = reopen ? "available" : "cancelled";
  await admin
    .from("lessons")
    .update({
      student_id: null,
      status,
      meet_link: null,
      google_event_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId);

  return status;
}

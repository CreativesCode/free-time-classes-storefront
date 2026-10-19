import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_GENERATION_WEEKS,
  enumerateSlotsForRule,
  getGenerationHorizon,
  slotKey,
} from "@/lib/availability/ruleExpansion";
import type {
  AvailabilityException,
  TutorAvailabilityRule,
} from "@/types/availability";

export interface SyncRuleSlotsResult {
  slotsCreated: number;
  generationStart: string;
  generationEnd: string;
  error?: string;
}

/**
 * Inserts the lessons a weekly rule implies inside the rolling generation
 * window, skipping slots that already exist. Idempotent: running it again
 * (rule creation, daily cron) only adds what is missing.
 */
export async function syncRuleSlots(
  admin: SupabaseClient,
  rule: TutorAvailabilityRule,
  exceptions: AvailabilityException[],
  weeksAhead: number = DEFAULT_GENERATION_WEEKS
): Promise<SyncRuleSlotsResult> {
  const slots = enumerateSlotsForRule(rule, exceptions, weeksAhead);

  const { start, end } = getGenerationHorizon(weeksAhead);
  const pad = (n: number) => String(n).padStart(2, "0");
  const generationStart = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T00:00:00`;
  const endBound = new Date(end);
  endBound.setDate(endBound.getDate() + 1);
  const generationEnd = `${endBound.getFullYear()}-${pad(endBound.getMonth() + 1)}-${pad(endBound.getDate())}T00:00:00`;

  const { data: existingLessons, error: existingError } = await admin
    .from("lessons")
    .select("scheduled_date_time,subject_id,duration_minutes,price")
    .eq("tutor_id", rule.tutor_id)
    .gte("scheduled_date_time", generationStart)
    .lt("scheduled_date_time", generationEnd);

  if (existingError) {
    return { slotsCreated: 0, generationStart, generationEnd, error: "Could not check existing slots." };
  }

  const taken = new Set(
    (existingLessons || []).map((row) =>
      slotKey({
        scheduled_date_time: String(row.scheduled_date_time)
          .replace(" ", "T")
          .slice(0, 19),
        subject_id: row.subject_id as number,
        duration_minutes: row.duration_minutes as number,
        price: Number(row.price ?? 0),
      })
    )
  );

  const rows = slots
    .filter((s) => !taken.has(slotKey(s)))
    .map((s) => ({
      tutor_id: rule.tutor_id,
      subject_id: s.subject_id,
      scheduled_date_time: s.scheduled_date_time,
      duration_minutes: s.duration_minutes,
      price: s.price,
      status: "available" as const,
      availability_rule_id: rule.id,
      updated_at: new Date().toISOString(),
    }));

  const chunk = 80;
  for (let i = 0; i < rows.length; i += chunk) {
    const { error: insErr } = await admin.from("lessons").insert(rows.slice(i, i + chunk));
    if (insErr) {
      return {
        slotsCreated: i,
        generationStart,
        generationEnd,
        error: insErr.message || "Could not generate slots.",
      };
    }
  }

  return { slotsCreated: rows.length, generationStart, generationEnd };
}

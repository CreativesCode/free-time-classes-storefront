import type {
  AvailabilityException,
  GeneratedLessonSlot,
  TutorAvailabilityRule,
} from "@/types/availability";

export const DEFAULT_GENERATION_WEEKS = 12;

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalDateTimeString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
}

function parseTimeToMinutesSinceMidnight(t: string): number {
  const part = t.slice(0, 5);
  const [h, m] = part.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function isFullDayBlocked(
  dateKey: string,
  blocked: AvailabilityException[]
): boolean {
  return blocked.some(
    (ex) =>
      ex.type === "blocked" &&
      ex.exception_date === dateKey &&
      ex.start_time == null &&
      ex.end_time == null
  );
}

function isSlotBlockedPartial(
  slotStart: Date,
  slotEnd: Date,
  dateKey: string,
  blocked: AvailabilityException[]
): boolean {
  for (const ex of blocked) {
    if (ex.type !== "blocked" || ex.exception_date !== dateKey) continue;
    if (ex.start_time == null || ex.end_time == null) continue;
    const [y, mo, da] = dateKey.split("-").map(Number);
    const parseT = (ts: string) => {
      const [hh, mm] = ts.slice(0, 5).split(":").map((x) => parseInt(x, 10));
      return new Date(y, mo - 1, da, hh, mm, 0, 0);
    };
    const bStart = parseT(ex.start_time);
    const bEnd = parseT(ex.end_time);
    if (slotStart < bEnd && slotEnd > bStart) return true;
  }
  return false;
}

export function getGenerationHorizon(weeksAhead: number): {
  start: Date;
  end: Date;
} {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + weeksAhead * 7);
  return { start, end };
}

/** Slots implied by a weekly rule, honoring blocked exceptions only. */
export function enumerateSlotsForRule(
  rule: TutorAvailabilityRule,
  blockedExceptions: AvailabilityException[],
  weeksAhead: number = DEFAULT_GENERATION_WEEKS
): GeneratedLessonSlot[] {
  if (!rule.is_active) return [];

  const { start: horizonStart, end: horizonEnd } =
    getGenerationHorizon(weeksAhead);
  const blocked = blockedExceptions.filter((e) => e.type === "blocked");

  const windowStartMin = parseTimeToMinutesSinceMidnight(rule.start_time);
  const windowEndMin = parseTimeToMinutesSinceMidnight(rule.end_time);

  const out: GeneratedLessonSlot[] = [];

  for (
    let d = new Date(horizonStart);
    d <= horizonEnd;
    d.setDate(d.getDate() + 1)
  ) {
    if (d.getDay() !== rule.day_of_week) continue;

    const dk = dateKeyLocal(d);
    if (isFullDayBlocked(dk, blocked)) continue;

    let cursorMin = windowStartMin;
    while (cursorMin + rule.duration_minutes <= windowEndMin) {
      const slotStart = new Date(d);
      slotStart.setHours(
        Math.floor(cursorMin / 60),
        cursorMin % 60,
        0,
        0
      );
      const slotEnd = new Date(
        slotStart.getTime() + rule.duration_minutes * 60_000
      );

      if (!isSlotBlockedPartial(slotStart, slotEnd, dk, blocked)) {
        out.push({
          scheduled_date_time: toLocalDateTimeString(slotStart),
          subject_id: rule.subject_id,
          duration_minutes: rule.duration_minutes,
          price: Number(rule.price),
        });
      }
      cursorMin += rule.duration_minutes;
    }
  }

  return out;
}

/** One-off extra windows from an exception row (type extra). */
export function slotsFromExtraException(
  ex: AvailabilityException
): GeneratedLessonSlot[] {
  if (
    ex.type !== "extra" ||
    !ex.start_time ||
    !ex.end_time ||
    ex.subject_id == null ||
    ex.duration_minutes == null ||
    ex.price == null
  ) {
    return [];
  }

  const [y, mo, da] = ex.exception_date.split("-").map(Number);
  const parseTmins = (ts: string) => {
    const [hh, mm] = ts.slice(0, 5).split(":").map((x) => parseInt(x, 10));
    return hh * 60 + mm;
  };

  const startM = parseTmins(ex.start_time);
  const endM = parseTmins(ex.end_time);
  const duration = ex.duration_minutes;
  const out: GeneratedLessonSlot[] = [];

  for (let cursor = startM; cursor + duration <= endM; cursor += duration) {
    const slotStart = new Date(y, mo - 1, da, Math.floor(cursor / 60), cursor % 60, 0, 0);
    out.push({
      scheduled_date_time: toLocalDateTimeString(slotStart),
      subject_id: ex.subject_id,
      duration_minutes: duration,
      price: Number(ex.price),
    });
  }

  return out;
}

export function slotKey(s: GeneratedLessonSlot): string {
  return `${s.scheduled_date_time}|${s.subject_id}|${s.duration_minutes}`;
}

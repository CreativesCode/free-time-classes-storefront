/**
 * Open start times for a course (PRP-001): the tutor's weekly windows plus
 * "extra" windows, minus "blocked" exceptions and already committed classes,
 * keeping only starts on the grid where the whole course duration fits.
 *
 * Pure and timezone-free: every value is Madrid wall-clock
 * (`YYYY-MM-DD`, `HH:mm[:ss]`, `YYYY-MM-DDTHH:mm:ss`) and the arithmetic is
 * done on calendar minutes, so the server timezone never leaks in (F087).
 */

/** Minutes between two consecutive bookable start times. */
export const START_GRID_MINUTES = 30;

/** How far ahead a class can be booked (product decision 2026-10-20). */
export const BOOKING_HORIZON_WEEKS = 8;

export type AvailabilityWindowRule = {
  day_of_week: number; // 0 = Sunday … 6 = Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type AvailabilityWindowException = {
  exception_date: string;
  start_time: string | null;
  end_time: string | null;
  type: "blocked" | "extra";
};

export type BusyInterval = {
  scheduled_date_time: string;
  duration_minutes: number;
};

export type OpenStartTimesInput = {
  rules: AvailabilityWindowRule[];
  exceptions: AvailabilityWindowException[];
  busy: BusyInterval[];
  durationMinutes: number;
  /** First and last day to scan, inclusive (`YYYY-MM-DD`). */
  fromDate: string;
  toDate: string;
  /** Earliest allowed start (`YYYY-MM-DDTHH:mm:ss`), e.g. now + minimum lead. */
  minStart: string;
  gridMinutes?: number;
};

const DAY_MINUTES = 24 * 60;

function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function dateKeyFromDayNumber(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

/** Absolute calendar minutes of a wall-clock timestamp. */
function timestampToMinutes(ts: string): number {
  const normalized = ts.replace(" ", "T");
  return dayNumber(normalized.slice(0, 10)) * DAY_MINUTES + timeToMinutes(normalized.slice(11, 16));
}

function minutesToTimestamp(total: number): string {
  const day = Math.floor(total / DAY_MINUTES);
  const rest = total - day * DAY_MINUTES;
  const hh = String(Math.floor(rest / 60)).padStart(2, "0");
  const mm = String(rest % 60).padStart(2, "0");
  return `${dateKeyFromDayNumber(day)}T${hh}:${mm}:00`;
}

export function computeOpenStartTimes(input: OpenStartTimesInput): string[] {
  const grid = input.gridMinutes ?? START_GRID_MINUTES;
  const duration = input.durationMinutes;
  if (!(duration > 0) || !(grid > 0)) return [];

  const minStart = timestampToMinutes(input.minStart);
  const busy = input.busy.map((b) => {
    const start = timestampToMinutes(b.scheduled_date_time);
    return { start, end: start + (b.duration_minutes ?? 0) };
  });

  const out = new Set<string>();
  const firstDay = dayNumber(input.fromDate);
  const lastDay = dayNumber(input.toDate);

  for (let day = firstDay; day <= lastDay; day++) {
    const dateKey = dateKeyFromDayNumber(day);
    // 1970-01-01 (day 0) was a Thursday.
    const dow = (((day + 4) % 7) + 7) % 7;
    const dayStart = day * DAY_MINUTES;

    const exceptions = input.exceptions.filter((e) => e.exception_date === dateKey);
    const blocks = exceptions.filter((e) => e.type === "blocked");
    if (blocks.some((b) => b.start_time == null || b.end_time == null)) continue;

    const windows: Array<{ start: number; end: number }> = [
      ...input.rules
        .filter((r) => r.is_active && r.day_of_week === dow)
        .map((r) => ({ start: timeToMinutes(r.start_time), end: timeToMinutes(r.end_time) })),
      ...exceptions
        .filter((e) => e.type === "extra" && e.start_time && e.end_time)
        .map((e) => ({
          start: timeToMinutes(e.start_time as string),
          end: timeToMinutes(e.end_time as string),
        })),
    ];
    const blocked = blocks.map((b) => ({
      start: dayStart + timeToMinutes(b.start_time as string),
      end: dayStart + timeToMinutes(b.end_time as string),
    }));

    for (const w of windows) {
      const firstStart = Math.ceil(w.start / grid) * grid;
      for (let m = firstStart; m + duration <= w.end; m += grid) {
        const start = dayStart + m;
        const end = start + duration;
        if (start < minStart) continue;
        if (blocked.some((b) => start < b.end && end > b.start)) continue;
        if (busy.some((b) => start < b.end && end > b.start)) continue;
        out.add(minutesToTimestamp(start));
      }
    }
  }

  return [...out].sort();
}

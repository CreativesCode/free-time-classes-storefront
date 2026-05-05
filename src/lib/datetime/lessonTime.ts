export const BUSINESS_TIMEZONE = "Europe/Madrid";

function dateAsLessonTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

export function nowAsLessonTimestamp(): string {
  return dateAsLessonTimestamp(new Date());
}

/**
 * Wall-clock Madrid timestamp `now + minutes`. Útil para fronteras
 * de antelación mínima y expiración de solicitudes.
 */
export function nowPlusMinutesAsLessonTimestamp(minutes: number): string {
  return dateAsLessonTimestamp(new Date(Date.now() + minutes * 60_000));
}

export function startOfTodayAsLessonTimestamp(): string {
  return `${nowAsLessonTimestamp().slice(0, 10)}T00:00:00`;
}

export function endOfTodayAsLessonTimestamp(): string {
  return `${nowAsLessonTimestamp().slice(0, 10)}T23:59:59`;
}

export function startOfMonthAsLessonTimestamp(): string {
  return `${nowAsLessonTimestamp().slice(0, 7)}-01T00:00:00`;
}

export function isLessonInPast(scheduledDateTime: string | null | undefined): boolean {
  if (!scheduledDateTime) return false;
  return scheduledDateTime < nowAsLessonTimestamp();
}

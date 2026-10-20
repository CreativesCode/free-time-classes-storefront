export const BUSINESS_TIMEZONE = "Europe/Madrid";

/** Madrid wall-clock timestamp (`YYYY-MM-DDTHH:mm:ss`) of an instant. */
export function dateAsLessonTimestamp(date: Date): string {
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

/**
 * Adds minutes to a Madrid wall-clock timestamp without going through the
 * server timezone (pure calendar arithmetic on the `YYYY-MM-DDTHH:mm:ss` parts).
 */
export function addMinutesToLessonTimestamp(timestamp: string, minutes: number): string {
  const [datePart, timePart = "00:00:00"] = timestamp.slice(0, 19).split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi, s = 0] = timePart.split(":").map(Number);
  const shifted = new Date(Date.UTC(y, mo - 1, d, h, mi + minutes, s));
  return shifted.toISOString().slice(0, 19);
}

export function isLessonInPast(scheduledDateTime: string | null | undefined): boolean {
  if (!scheduledDateTime) return false;
  return scheduledDateTime < nowAsLessonTimestamp();
}

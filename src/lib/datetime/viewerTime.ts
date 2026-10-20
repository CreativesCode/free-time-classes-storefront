import { useSyncExternalStore } from "react";
import { BUSINESS_TIMEZONE } from "./lessonTime";

/** Offset (ms) of `timeZone` at instant `epochMs`: wall-clock minus UTC. */
function zoneOffsetMs(epochMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(epochMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/**
 * Real instant of a lesson timestamp. Lesson timestamps are Madrid wall-clock
 * without offset (`YYYY-MM-DDTHH:mm:ss`); a value that already carries an
 * offset or `Z` is parsed as is.
 */
export function lessonTimestampToDate(timestamp: string): Date {
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(timestamp)) return new Date(timestamp);
  const [datePart, timePart = "00:00:00"] = timestamp.slice(0, 19).split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi, s = 0] = timePart.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  // Two passes settle the offset around DST changes.
  let epoch = wallAsUtc - zoneOffsetMs(wallAsUtc, BUSINESS_TIMEZONE);
  epoch = wallAsUtc - zoneOffsetMs(epoch, BUSINESS_TIMEZONE);
  return new Date(epoch);
}

/** Epoch ms of a lesson timestamp (for countdowns and sorting). */
export function lessonTimestampToEpoch(timestamp: string): number {
  return lessonTimestampToDate(timestamp).getTime();
}

/** `YYYY-MM-DD` of an instant in `timeZone`. */
export function dayKeyInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const subscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || BUSINESS_TIMEZONE;
const serverTimeZone = () => BUSINESS_TIMEZONE;

/**
 * Time zone the viewer's times are shown in: the browser's. The server render
 * and hydration use Madrid so the markup matches; the client then switches.
 */
export function useViewerTimeZone(): string {
  return useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
}

/** Formats a lesson timestamp in the viewer's time zone. */
export function formatLessonTimestamp(
  timestamp: string,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return lessonTimestampToDate(timestamp).toLocaleString(locale, { ...options, timeZone });
}

/** Short zone name shown next to times, e.g. "GMT-4" or "CEST". */
export function timeZoneLabel(locale: string, timeZone: string, at: Date = new Date()): string {
  const part = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "short" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

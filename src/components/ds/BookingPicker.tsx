"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import {
  dayKeyInZone,
  formatLessonTimestamp,
  lessonTimestampToDate,
  timeZoneLabel,
  useViewerTimeZone,
} from "@/lib/datetime/viewerTime";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  LogIn,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  locale: string;
  courseId: number;
  tutorId: string;
  /** Used as informational header text */
  tutorName?: string | null;
  /** Path to redirect back to after login. e.g. /es/courses/12 */
  coursePath?: string;
  /** Called whenever the picker's selection changes — useful so the parent
   *  page can hide its own sticky CTA while the picker shows its own. */
  onSelectionChange?: (hasSelection: boolean) => void;
}

type OpenTimesResponse = {
  course?: { id: number; durationMinutes: number; pricePerSession: number };
  times?: string[];
  error?: string;
};

const DAYS_PER_PAGE = 7;

/** Day number of a `YYYY-MM-DD` key (calendar arithmetic, no timezone). */
function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function dayKey(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** Formats a wall-clock day key without letting the browser shift it. */
function formatDay(key: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString(locale, { ...options, timeZone: "UTC" });
}

export function BookingPicker({
  locale,
  courseId,
  tutorId,
  tutorName,
  coursePath,
  onSelectionChange,
}: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations("studentProfile.availabilities");
  const tCourse = useTranslations("courseDetail");
  // Open times are Madrid wall-clock; days and hours are shown in the viewer's zone.
  const timeZone = useViewerTimeZone();

  const [times, setTimes] = useState<string[]>([]);
  const [course, setCourse] = useState<OpenTimesResponse["course"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  // Open times are public (no login needed); booking requires a student.
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch(`/api/availability/open-times?courseId=${courseId}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as OpenTimesResponse | null;
      if (!res.ok) throw new Error(json?.error || "load_failed");
      setTimes(json?.times ?? []);
      setCourse(json?.course ?? null);
    } catch {
      setLoadError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [courseId, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const timesByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const ts of times) {
      const key = dayKeyInZone(lessonTimestampToDate(ts), timeZone);
      const list = map.get(key);
      if (list) list.push(ts);
      else map.set(key, [ts]);
    }
    return map;
  }, [times, timeZone]);

  // Days from today (first open day's week) to the last open day.
  const days = useMemo(() => {
    const keys = Array.from(timesByDay.keys());
    if (keys.length === 0) return [] as string[];
    const first = dayNumber(keys[0]);
    const last = dayNumber(keys[keys.length - 1]);
    return Array.from({ length: last - first + 1 }, (_, i) => dayKey(first + i));
  }, [timesByDay]);

  const pageCount = Math.max(1, Math.ceil(days.length / DAYS_PER_PAGE));
  const pageDays = useMemo(
    () => days.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE),
    [days, page]
  );

  // Auto-select the first day with times on the current page.
  useEffect(() => {
    if (selectedDayKey && pageDays.includes(selectedDayKey)) return;
    const firstOpen = pageDays.find((key) => (timesByDay.get(key)?.length ?? 0) > 0);
    setSelectedDayKey(firstOpen ?? null);
  }, [pageDays, timesByDay, selectedDayKey]);

  useEffect(() => {
    onSelectionChange?.(selectedStart != null);
  }, [selectedStart, onSelectionChange]);

  const timesForSelectedDay = selectedDayKey ? timesByDay.get(selectedDayKey) ?? [] : [];
  const formatHour = (ts: string) =>
    formatLessonTimestamp(ts, locale, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const selectedDay = selectedStart ? dayKeyInZone(lessonTimestampToDate(selectedStart), timeZone) : null;

  const loginHref = coursePath
    ? `/${locale}/login?next=${encodeURIComponent(`${coursePath}#course-booking`)}`
    : `/${locale}/login`;

  const handleBook = useCallback(async () => {
    if (!selectedStart || !user) return;
    try {
      setBookingLoading(true);
      const res = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, start: selectedStart }),
      });
      const json = (await res.json().catch(() => null)) as { code?: string } | null;
      if (!res.ok) {
        const code = json?.code ?? "";
        const key =
          code === "slot_unavailable" || code === "tutor_busy"
            ? "slotTaken"
            : code === "student_busy"
              ? "youAreBusy"
              : "bookingRequestedError";
        toast.error(t(key));
        if (res.status === 409) {
          setSelectedStart(null);
          void reload();
        }
        return;
      }
      toast.success(t("bookingRequested"));
      setBookingDone(true);
      setSelectedStart(null);
      void reload();
    } catch {
      toast.error(t("bookingRequestedError"));
    } finally {
      setBookingLoading(false);
    }
  }, [selectedStart, user, courseId, t, reload]);

  const price = course ? Number(course.pricePerSession).toFixed(0) : null;
  const duration = course?.durationMinutes ?? null;
  const canBook = !!user?.is_student;

  return (
    <>
      <section id="course-booking" className="scroll-mt-28 space-y-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ft-ink">
            <Calendar width={16} height={16} className="text-ft-accent-deep" />
            {tCourse("bookingSectionTitle")}
          </div>
          {tutorName && (
            <span className="hidden text-[12px] text-ft-ink-3 md:inline">{tutorName}</span>
          )}
        </div>

        {loadError ? (
          <div className="rounded-ft-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-ft-ink-3" />
          </div>
        ) : times.length === 0 ? (
          <div className="rounded-ft-lg border border-dashed border-ft-line bg-ft-surface-1 p-8 text-center">
            <Sparkles width={20} height={20} className="mx-auto mb-2 text-ft-ink-3" />
            <p className="m-0 text-sm text-ft-ink-2">{t("noAvailabilities")}</p>
            <Link
              href={`/${locale}/tutors/${tutorId}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ft-accent-deep hover:underline"
            >
              {t("contactTutorInstead")}
              <ArrowRight width={12} height={12} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label={t("previousWeek")}
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-ft-line text-ft-ink-2 disabled:opacity-40"
              >
                <ChevronLeft width={16} height={16} />
              </button>
              <div className="hide-scroll -mx-1 flex flex-1 gap-2 overflow-x-auto py-1 pl-1 pr-1">
                {pageDays.map((key) => {
                  const enabled = (timesByDay.get(key)?.length ?? 0) > 0;
                  const active = selectedDayKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!enabled}
                      onClick={() => {
                        setSelectedDayKey(key);
                        setSelectedStart(null);
                      }}
                      className={cn(
                        "relative flex w-[56px] flex-shrink-0 flex-col items-center gap-1 rounded-ft-md border px-2 py-3 transition-colors",
                        active
                          ? "border-ft-ink bg-ft-ink text-ft-paper"
                          : enabled
                            ? "border-ft-line bg-ft-paper text-ft-ink-2 hover:bg-ft-paper-deep"
                            : "border-ft-line-soft bg-ft-surface-1 text-ft-ink-3 opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-[0.06em]",
                          active ? "text-ft-paper/80" : "text-ft-ink-3"
                        )}
                      >
                        {formatDay(key, locale, { weekday: "short" })}
                      </span>
                      <span className="text-[18px] font-semibold leading-none tracking-tight">
                        {Number(key.slice(8, 10))}
                      </span>
                      {enabled && !active && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-ft-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                aria-label={t("nextWeek")}
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-ft-line text-ft-ink-2 disabled:opacity-40"
              >
                <ChevronRight width={16} height={16} />
              </button>
            </div>

            {timesForSelectedDay.length === 0 ? (
              <div className="rounded-ft-lg border border-dashed border-ft-line bg-ft-surface-1 p-6 text-center text-sm text-ft-ink-2">
                {t("noTimesThisWeek")}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {timesForSelectedDay.map((ts) => {
                  const isSelected = selectedStart === ts;
                  return (
                    <button
                      key={ts}
                      type="button"
                      onClick={() => setSelectedStart(ts)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-ft-md border px-2 py-3 transition-colors",
                        isSelected
                          ? "border-ft-ink bg-ft-ink text-ft-paper"
                          : "border-ft-line bg-ft-paper text-ft-ink hover:bg-ft-paper-deep"
                      )}
                    >
                      <span className="text-[15px] font-semibold tracking-tight">
                        {formatHour(ts)}
                      </span>
                      {duration && (
                        <span
                          className={cn(
                            "text-[10px]",
                            isSelected ? "text-ft-paper/80" : "text-ft-ink-3"
                          )}
                        >
                          {duration} {t("minutes")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="m-0 text-[11px] text-ft-ink-3">{t("viewerTimeNote", {
                zone: timeZoneLabel(locale, timeZone, lessonTimestampToDate(timesForSelectedDay[0] ?? times[0])),
              })}</p>

            {selectedStart && (
              <div className="rounded-ft-lg border border-ft-line bg-ft-paper-deep p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3">
                      {t("dateTime")}
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold tracking-tight text-ft-ink">
                      {formatDay(selectedDay ?? "", locale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {" · "}
                      {formatHour(selectedStart)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStart(null)}
                    aria-label={t("cancel")}
                    className="grid h-8 w-8 place-items-center rounded-full text-ft-ink-3 hover:bg-ft-paper hover:text-ft-ink"
                  >
                    <X width={14} height={14} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ft-ink-2">
                  {duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock width={12} height={12} />
                      {duration} {t("minutes")}
                    </span>
                  )}
                  {price && (
                    <span className="inline-flex items-center gap-1 font-semibold text-ft-ink">
                      {price}€
                    </span>
                  )}
                </div>
              </div>
            )}

            {bookingDone && !selectedStart && (
              <div className="rounded-ft-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {t("bookingRequested")}
              </div>
            )}
          </>
        )}
      </section>

      {/* Sticky confirm bar — appears only when a time is selected */}
      {selectedStart && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ft-line-soft bg-[rgba(252,250,246,0.96)] backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-5 py-3.5 md:px-9">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-ft-ink-3">
                {formatDay(selectedDay ?? "", locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {" · "}
                {formatHour(selectedStart)}
                {duration ? ` · ${duration} ${t("minutes")}` : ""}
              </div>
              {price && (
                <div className="text-[18px] font-semibold leading-tight tracking-tight text-ft-ink">
                  {price}€
                </div>
              )}
            </div>
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-ft-ink-3" />
            ) : !user ? (
              <Link
                href={loginHref}
                className="inline-flex h-12 items-center gap-2 rounded-ft-md bg-ft-ink px-5 text-sm font-semibold text-ft-paper transition-colors hover:bg-[#2a241b]"
              >
                <LogIn width={14} height={14} />
                {tCourse("bookingLoginCta")}
              </Link>
            ) : !canBook ? (
              <span className="max-w-[45%] text-right text-[12px] text-ft-ink-3">
                {tCourse("bookingStudentsOnly")}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleBook}
                disabled={bookingLoading}
                className="inline-flex h-12 items-center gap-2 rounded-ft-md bg-ft-ink px-5 text-sm font-semibold text-ft-paper transition-colors hover:bg-[#2a241b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bookingLoading ? (
                  <Loader2 width={14} height={14} className="animate-spin" />
                ) : (
                  <ArrowRight width={14} height={14} />
                )}
                {bookingLoading ? t("booking") : t("book")}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

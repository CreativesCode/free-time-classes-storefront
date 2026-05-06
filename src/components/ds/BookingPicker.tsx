"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { isLessonInPast } from "@/lib/datetime/lessonTime";
import { cn } from "@/lib/utils";
import type { LessonWithRelations } from "@/types/lesson";
import {
  ArrowRight,
  Calendar,
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
  tutorId: string;
  /** Used as fallback "view tutor" / informational header text */
  tutorName?: string | null;
  /** Pre-filter slots by subject when present and > 0 */
  subjectId?: number | null;
  /** Path to redirect back to after login. e.g. /es/courses/uuid */
  coursePath?: string;
  /** Called whenever the picker's slot selection changes — useful so the
   *  parent page can hide its own sticky CTA while the picker shows its own. */
  onSelectionChange?: (hasSelection: boolean) => void;
}

const DAYS_LOOKAHEAD = 14;

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

async function fetchAvailableSlots(
  tutorId: string,
  subjectId?: number | null
): Promise<LessonWithRelations[]> {
  const params = new URLSearchParams();
  params.set("tutorId", tutorId);
  if (subjectId && subjectId > 0) {
    params.set("subjectId", String(subjectId));
  }
  const res = await fetch(`/api/lessons/available?${params}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as
    | { items?: LessonWithRelations[]; error?: string }
    | null;
  if (!res.ok) {
    throw new Error(json?.error || "Failed to load available slots.");
  }
  return json?.items ?? [];
}

export function BookingPicker({
  locale,
  tutorId,
  tutorName,
  subjectId,
  coursePath,
  onSelectionChange,
}: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations("studentProfile.availabilities");
  const tCourse = useTranslations("courseDetail");

  const [slots, setSlots] = useState<LessonWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const items = await fetchAvailableSlots(tutorId, subjectId);
      const future = items.filter(
        (l) => l.scheduled_date_time && !isLessonInPast(l.scheduled_date_time)
      );
      setSlots(future);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [tutorId, subjectId, t]);

  useEffect(() => {
    if (!user || !user.is_student) return;
    void reload();
  }, [user, reload]);

  // Build the next 14 days, starting today, in browser-local time (matches
  // the way scheduled_date_time strings are interpreted everywhere else).
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_LOOKAHEAD }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, LessonWithRelations[]>();
    for (const slot of slots) {
      if (!slot.scheduled_date_time) continue;
      const d = new Date(slot.scheduled_date_time);
      const key = localDayKey(d);
      const list = map.get(key);
      if (list) list.push(slot);
      else map.set(key, [slot]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const ta = new Date(a.scheduled_date_time ?? 0).getTime();
        const tb = new Date(b.scheduled_date_time ?? 0).getTime();
        return ta - tb;
      });
    }
    return map;
  }, [slots]);

  // Auto-select first day with slots
  useEffect(() => {
    if (selectedDayKey != null) return;
    for (const d of days) {
      const key = localDayKey(d);
      if ((slotsByDay.get(key)?.length ?? 0) > 0) {
        setSelectedDayKey(key);
        return;
      }
    }
  }, [days, slotsByDay, selectedDayKey]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedSlotId != null);
  }, [selectedSlotId, onSelectionChange]);

  const slotsForSelectedDay = selectedDayKey
    ? slotsByDay.get(selectedDayKey) ?? []
    : [];

  const selectedSlot =
    selectedSlotId != null
      ? slots.find((s) => s.id === selectedSlotId) ?? null
      : null;

  const handleBook = useCallback(async () => {
    if (!selectedSlot || !user) return;
    try {
      setBookingLoading(true);
      const res = await fetch("/api/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: selectedSlot.id }),
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(json?.error || t("bookingRequestedError"));
      }
      toast.success(t("bookingRequested"));
      setBookingDone(true);
      setSelectedSlotId(null);
      void reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("bookingRequestedError")
      );
    } finally {
      setBookingLoading(false);
    }
  }, [selectedSlot, user, t, reload]);

  // ── Auth gates ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <section
        id="course-booking"
        className="scroll-mt-28 rounded-ft-lg border border-ft-line-soft bg-ft-paper p-10 text-center"
      >
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-ft-ink-3" />
      </section>
    );
  }

  if (!user) {
    const next = coursePath
      ? `/${locale}/login?next=${encodeURIComponent(`${coursePath}#course-booking`)}`
      : `/${locale}/login`;
    return (
      <section
        id="course-booking"
        className="scroll-mt-28 rounded-ft-lg border border-ft-line-soft bg-ft-paper p-6"
      >
        <div className="mb-3 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ft-ink">
          <Calendar width={16} height={16} className="text-ft-accent-deep" />
          {tCourse("bookingSectionTitle")}
        </div>
        <p className="m-0 mb-4 text-[14px] leading-relaxed text-ft-ink-2">
          {tCourse("bookingLoginPrompt")}
        </p>
        <Link
          href={next}
          className="inline-flex items-center gap-2 rounded-ft-md bg-ft-ink px-5 py-3 text-[13px] font-semibold text-ft-paper transition-colors hover:bg-[#2a241b]"
        >
          <LogIn width={14} height={14} />
          {tCourse("bookingLoginCta")}
        </Link>
      </section>
    );
  }

  if (!user.is_student) {
    return (
      <section
        id="course-booking"
        className="scroll-mt-28 rounded-ft-lg border border-ft-line-soft bg-ft-paper p-6"
      >
        <div className="mb-3 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ft-ink">
          <Calendar width={16} height={16} className="text-ft-accent-deep" />
          {tCourse("bookingSectionTitle")}
        </div>
        <p className="m-0 text-[14px] leading-relaxed text-ft-ink-2">
          {tCourse("bookingStudentsOnly")}
        </p>
      </section>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────
  return (
    <>
      <section id="course-booking" className="scroll-mt-28 space-y-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ft-ink">
            <Calendar width={16} height={16} className="text-ft-accent-deep" />
            {tCourse("bookingSectionTitle")}
          </div>
          {tutorName && (
            <span className="hidden text-[12px] text-ft-ink-3 md:inline">
              {tutorName}
            </span>
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
        ) : (
          <>
            {/* Date picker horizontal */}
            <div className="hide-scroll -mx-1 flex gap-2 overflow-x-auto py-1 pl-1 pr-1">
              {days.map((d) => {
                const key = localDayKey(d);
                const count = slotsByDay.get(key)?.length ?? 0;
                const enabled = count > 0;
                const active = selectedDayKey === key;
                const dayLabel = d.toLocaleDateString(locale, {
                  weekday: "short",
                });
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      setSelectedDayKey(key);
                      setSelectedSlotId(null);
                    }}
                    className={cn(
                      "relative flex w-[60px] flex-shrink-0 flex-col items-center gap-1 rounded-ft-md border px-2 py-3 transition-colors",
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
                      {dayLabel}
                    </span>
                    <span className="text-[18px] font-semibold leading-none tracking-tight">
                      {d.getDate()}
                    </span>
                    {enabled && !active && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-ft-accent" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time slots grid */}
            {selectedDayKey == null || slotsForSelectedDay.length === 0 ? (
              <div className="rounded-ft-lg border border-dashed border-ft-line bg-ft-surface-1 p-8 text-center">
                <Sparkles
                  width={20}
                  height={20}
                  className="mx-auto mb-2 text-ft-ink-3"
                />
                <p className="m-0 text-sm text-ft-ink-2">
                  {t("noAvailabilities")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slotsForSelectedDay.map((slot) => {
                  const date = new Date(slot.scheduled_date_time ?? 0);
                  const time = date.toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-ft-md border px-2 py-3 transition-colors",
                        isSelected
                          ? "border-ft-ink bg-ft-ink text-ft-paper"
                          : "border-ft-line bg-ft-paper text-ft-ink hover:bg-ft-paper-deep"
                      )}
                    >
                      <span className="text-[15px] font-semibold tracking-tight">
                        {time}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          isSelected ? "text-ft-paper/80" : "text-ft-ink-3"
                        )}
                      >
                        {slot.duration_minutes} {t("minutes")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected slot detail */}
            {selectedSlot && (
              <div className="rounded-ft-lg border border-ft-line bg-ft-paper-deep p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ft-ink-3">
                      {t("dateTime")}
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold tracking-tight text-ft-ink">
                      {new Date(
                        selectedSlot.scheduled_date_time ?? 0
                      ).toLocaleDateString(locale, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {" · "}
                      {new Date(
                        selectedSlot.scheduled_date_time ?? 0
                      ).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                    {selectedSlot.subject?.name && (
                      <div className="mt-0.5 text-[12px] text-ft-ink-3">
                        {selectedSlot.subject.name}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSlotId(null)}
                    aria-label={t("cancel")}
                    className="grid h-8 w-8 place-items-center rounded-full text-ft-ink-3 hover:bg-ft-paper hover:text-ft-ink"
                  >
                    <X width={14} height={14} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ft-ink-2">
                  <span className="inline-flex items-center gap-1">
                    <Clock width={12} height={12} />
                    {selectedSlot.duration_minutes} {t("minutes")}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ft-ink">
                    {Number(selectedSlot.price).toFixed(0)}€
                  </span>
                </div>
              </div>
            )}

            {bookingDone && !selectedSlot && (
              <div className="rounded-ft-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {t("bookingRequested")}
              </div>
            )}
          </>
        )}
      </section>

      {/* Sticky confirm bar — appears only when a slot is selected */}
      {selectedSlot && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ft-line-soft bg-[rgba(252,250,246,0.96)] backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-5 py-3.5 md:px-9">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-ft-ink-3">
                {new Date(
                  selectedSlot.scheduled_date_time ?? 0
                ).toLocaleDateString(locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {" · "}
                {new Date(
                  selectedSlot.scheduled_date_time ?? 0
                ).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                {" · "}
                {selectedSlot.duration_minutes} {t("minutes")}
              </div>
              <div className="text-[18px] font-semibold leading-tight tracking-tight text-ft-ink">
                {Number(selectedSlot.price).toFixed(0)}€
              </div>
            </div>
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
          </div>
        </div>
      )}
    </>
  );
}

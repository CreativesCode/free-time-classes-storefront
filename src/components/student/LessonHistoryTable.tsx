"use client";

import LeaveReviewModal from "@/components/student/LeaveReviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import {
  getBookingsByStudentAndLessonIds,
  isBookingStatusEligibleForReview,
} from "@/lib/supabase/queries/bookings";
import { getLessonsWithRelations } from "@/lib/supabase/queries/lessons";
import {
  getReviewsByStudentAndBookingIds,
  getReviewsByStudentAndLessonIds,
} from "@/lib/supabase/queries/reviews";
import {
  addFavoriteTutor,
  getFavoriteTutorIds,
  removeFavoriteTutor,
} from "@/lib/supabase/queries/studentFavorites";
import { getPublicUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { LessonWithRelations } from "@/types/lesson";
import type { Review } from "@/types/review";
import { Calendar, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TutorUserInfo = {
  id: string;
  username: string;
  email: string;
  profile_picture?: string | null;
};

/**
 * Reseña por `lesson_id` (sin booking) o por reservas de la lección.
 */
function resolveReviewForLesson(
  lessonId: number,
  lessonTutorId: string,
  lessonCompleted: boolean,
  bookings: Pick<Booking, "id" | "lesson_id" | "tutor_id" | "status">[],
  reviewsByBookingId: Record<number, Review>,
  reviewsByLessonId: Record<number, Review>
): {
  review: Review | null;
  bookingForNewReview: { bookingId: number; tutorId: string } | null;
  lessonForNewReview: { lessonId: number; tutorId: string } | null;
  hasBookingButCannotReview: boolean;
} {
  const byLesson = reviewsByLessonId[lessonId];
  if (byLesson) {
    return {
      review: byLesson,
      bookingForNewReview: null,
      lessonForNewReview: null,
      hasBookingButCannotReview: false,
    };
  }

  const forLesson = bookings.filter((b) => b.lesson_id === lessonId);
  const eligible = forLesson.filter((b) =>
    isBookingStatusEligibleForReview(b.status, { lessonCompleted })
  );

  let review: Review | null = null;
  for (const b of eligible) {
    const r = reviewsByBookingId[b.id];
    if (r) {
      review = r;
      break;
    }
  }
  if (!review) {
    for (const b of forLesson) {
      const r = reviewsByBookingId[b.id];
      if (r) {
        review = r;
        break;
      }
    }
  }

  if (review) {
    return {
      review,
      bookingForNewReview: null,
      lessonForNewReview: null,
      hasBookingButCannotReview: false,
    };
  }

  const unratedEligible = eligible.filter((b) => !reviewsByBookingId[b.id]);
  if (unratedEligible.length > 0) {
    const chosen = [...unratedEligible].sort((a, b) => b.id - a.id)[0];
    return {
      review: null,
      bookingForNewReview: {
        bookingId: chosen.id,
        tutorId: chosen.tutor_id,
      },
      lessonForNewReview: null,
      hasBookingButCannotReview: false,
    };
  }

  if (lessonCompleted) {
    return {
      review: null,
      bookingForNewReview: null,
      lessonForNewReview: { lessonId, tutorId: lessonTutorId },
      hasBookingButCannotReview: false,
    };
  }

  return {
    review: null,
    bookingForNewReview: null,
    lessonForNewReview: null,
    hasBookingButCannotReview: forLesson.length > 0,
  };
}

export default function LessonHistoryTable(props: {
  favoritesRevision?: number;
  onFavoritesChanged?: () => void;
}) {
  const { user } = useAuth();
  const t = useTranslations("studentProfile");
  // Keep demo-seed capability in code, but hidden by default.
  const canSeedDemo = false && process.env.NODE_ENV !== "production";

  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
  const [reviewsByBookingId, setReviewsByBookingId] = useState<
    Record<number, Review>
  >({});
  const [reviewsByLessonId, setReviewsByLessonId] = useState<
    Record<number, Review>
  >({});

  const [leaveReviewOpen, setLeaveReviewOpen] = useState(false);
  const [selectedReviewTarget, setSelectedReviewTarget] = useState<{
    bookingId: number | null;
    lessonId: number | null;
    tutorId: string;
  } | null>(null);

  const [favoriteTutorIds, setFavoriteTutorIds] = useState<Set<string>>(
    () => new Set()
  );
  const [favoriteActionLoading, setFavoriteActionLoading] = useState<
    string | null
  >(null);

  const nowIso = useMemo(() => new Date().toISOString(), []);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!user?.id) return;

      try {
        const ids = await getFavoriteTutorIds(user.id);
        if (cancelled) return;
        setFavoriteTutorIds(new Set(ids));
      } catch (e) {
        console.error("Error loading favorite tutors:", e);
      }
    }

    void loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [user?.id, props.favoritesRevision]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getLessonsWithRelations({
          student_id: user.id,
          status: "completed",
          scheduled_date_time_lte: nowIso,
        });

        if (cancelled) return;

        const sorted = [...(data || [])].sort((a, b) => {
          const aTime = a.scheduled_date_time
            ? new Date(a.scheduled_date_time).getTime()
            : 0;
          const bTime = b.scheduled_date_time
            ? new Date(b.scheduled_date_time).getTime()
            : 0;
          return bTime - aTime;
        });

        setLessons(sorted);

        // Map lesson -> booking + reviews.
        // Si fallan (por ejemplo, porque todavía no se ha aplicado la migración),
        // mostramos igual el historial y omitimos la funcionalidad de reseñas.
        try {
          const lessonIds = sorted.map((l) => l.id);
          const bookings =
            lessonIds.length > 0
              ? await getBookingsByStudentAndLessonIds(user.id, lessonIds)
              : [];

          if (cancelled) return;

          setHistoryBookings(bookings);

          const bookingIds = bookings.map((b) => b.id);
          const [bookingReviews, lessonReviews] = await Promise.all([
            bookingIds.length > 0
              ? getReviewsByStudentAndBookingIds(user.id, bookingIds)
              : Promise.resolve([] as Review[]),
            lessonIds.length > 0
              ? getReviewsByStudentAndLessonIds(user.id, lessonIds)
              : Promise.resolve([] as Review[]),
          ]);

          if (cancelled) return;

          const nextReviewsByBookingId: Record<number, Review> = {};
          for (const r of bookingReviews) {
            if (r.booking_id != null) {
              nextReviewsByBookingId[r.booking_id] = r;
            }
          }
          setReviewsByBookingId(nextReviewsByBookingId);

          const nextReviewsByLessonId: Record<number, Review> = {};
          for (const r of lessonReviews) {
            if (r.lesson_id != null) {
              nextReviewsByLessonId[r.lesson_id] = r;
            }
          }
          setReviewsByLessonId(nextReviewsByLessonId);
        } catch (e) {
          console.error("[reviews] Failed loading booking/review info:", e);
        }
      } catch (e) {
        console.error("Error loading lesson history:", e);
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user?.id, nowIso, refreshKey]);

  async function handleSeedDemoReviews() {
    if (!user?.id || seedLoading) return;
    setSeedLoading(true);
    try {
      const res = await fetch(`/api/dev/seed-reviews`, {
        method: "POST",
      });

      const json = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || json?.error) {
        toast.error(json?.error || t("seedReviewsError"));
        return;
      }

      toast.success(t("seedReviewsSuccess"));
      setRefreshKey((n) => n + 1);
    } catch (e) {
      console.error("[seedReviews] error:", e);
      toast.error(t("seedReviewsError"));
    } finally {
      setSeedLoading(false);
    }
  }

  const toggleFavorite = async (tutorId: string) => {
    if (!user?.id) return;
    if (favoriteActionLoading) return;

    const isFavorited = favoriteTutorIds.has(tutorId);

    try {
      setFavoriteActionLoading(tutorId);

      if (isFavorited) {
        await removeFavoriteTutor(user.id, tutorId);
        setFavoriteTutorIds((prev) => {
          const next = new Set(prev);
          next.delete(tutorId);
          return next;
        });
        toast.success(t("favoriteRemoved"));
      } else {
        await addFavoriteTutor(user.id, tutorId);
        setFavoriteTutorIds((prev) => {
          const next = new Set(prev);
          next.add(tutorId);
          return next;
        });
        toast.success(t("favoriteAdded"));
      }
      props.onFavoritesChanged?.();
    } catch (e) {
      console.error("Error toggling favorite tutor:", e);
      toast.error(t("favoriteToggleError"));
    } finally {
      setFavoriteActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full rounded-md border-border/60">
        <CardContent className="py-8 text-center text-sm text-gray-500">
          Cargando...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full rounded-md border-border/60">
        <CardContent className="py-8 text-center text-destructive text-sm">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-md border-border/60">
      <CardHeader>
        <CardTitle>{t("lessonHistory")}</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {t("noLessonsHistory")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2 font-medium">Tutor</th>
                  <th className="pb-2 font-medium">Materia</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Duración</th>
                  <th className="pb-2 font-medium">Precio</th>
                  <th className="pb-2 font-medium">{t("reviewColumn")}</th>
                  <th className="pb-2 font-medium">Favorito</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const lessonCompleted = lesson.status === "completed";
                  const {
                    review,
                    bookingForNewReview,
                    lessonForNewReview,
                    hasBookingButCannotReview,
                  } = resolveReviewForLesson(
                    lesson.id,
                    lesson.tutor_id,
                    lessonCompleted,
                    historyBookings,
                    reviewsByBookingId,
                    reviewsByLessonId
                  );

                  const tutor: TutorUserInfo | null = lesson.tutor?.user ?? null;
                  const tutorProfilePicture = tutor?.profile_picture;
                  const tutorAvatarUrl =
                    tutorProfilePicture && typeof tutorProfilePicture === "string"
                      ? tutorProfilePicture.startsWith("http")
                        ? tutorProfilePicture
                        : getPublicUrl("avatars", tutorProfilePicture)
                      : null;

                  const isFavorited = favoriteTutorIds.has(lesson.tutor_id);

                  return (
                    <tr
                      key={lesson.id}
                      className="border-t last:border-b border-gray-100"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                            {tutorAvatarUrl ? (
                              <Image
                                src={tutorAvatarUrl}
                                alt={tutor?.username || "Tutor"}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-primary-800 font-semibold">
                                {(tutor?.username?.[0] || "U").toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {tutor?.username ?? "—"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {tutor?.email ?? ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{lesson.subject?.name ?? "—"}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {lesson.scheduled_date_time
                              ? new Date(
                                lesson.scheduled_date_time
                              ).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {lesson.duration_minutes} {t("availabilities.minutes")}
                      </td>
                      <td className="py-3 font-medium text-primary-600">
                        ${lesson.price}
                      </td>

                      <td className="py-3">
                        {review ? (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary-600" fill="currentColor" />
                            <span className="text-xs text-gray-700">
                              {review.rating}/5
                            </span>
                          </div>
                        ) : bookingForNewReview || lessonForNewReview ? (
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-violet-700 px-3.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 sm:text-sm"
                            onClick={() => {
                              if (bookingForNewReview) {
                                setSelectedReviewTarget({
                                  bookingId: bookingForNewReview.bookingId,
                                  lessonId: null,
                                  tutorId: bookingForNewReview.tutorId,
                                });
                              } else if (lessonForNewReview) {
                                setSelectedReviewTarget({
                                  bookingId: null,
                                  lessonId: lessonForNewReview.lessonId,
                                  tutorId: lessonForNewReview.tutorId,
                                });
                              }
                              setLeaveReviewOpen(true);
                            }}
                          >
                            <Star className="h-3.5 w-3.5 shrink-0 fill-white text-white" />
                            {t("leaveReview")}
                          </Button>
                        ) : hasBookingButCannotReview ? (
                          <span
                            className="max-w-[10rem] text-gray-500 text-xs leading-snug"
                            title={t("reviewUnavailableShort")}
                          >
                            {t("reviewUnavailableShort")}
                          </span>
                        ) : (
                          <span
                            className="max-w-[11rem] text-gray-500 text-xs leading-snug"
                            title={t("reviewNoBookingHint")}
                          >
                            {t("reviewNoBookingHint")}
                          </span>
                        )}
                      </td>

                      <td className="py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-9 w-9 shrink-0 rounded-full border transition-colors",
                            isFavorited
                              ? "border-violet-500 bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-900"
                              : "border-violet-200/90 bg-white text-violet-400 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
                          )}
                          onClick={() => toggleFavorite(lesson.tutor_id)}
                          disabled={favoriteActionLoading === lesson.tutor_id}
                          aria-pressed={isFavorited}
                          aria-label={
                            isFavorited ? t("unfavorite") : t("favorite")
                          }
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              isFavorited
                                ? "fill-violet-600 text-violet-600"
                                : "text-violet-400"
                            )}
                            fill={isFavorited ? "currentColor" : "none"}
                            strokeWidth={isFavorited ? 0 : 2}
                          />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {canSeedDemo ? (
          <div className="pt-6">
            <Button
              variant="secondary"
              onClick={() => void handleSeedDemoReviews()}
              disabled={!user?.id || seedLoading}
              className="w-full"
            >
              {seedLoading ? t("seedReviewsLoading") : t("seedReviewsDemo")}
            </Button>
          </div>
        ) : null}
      </CardContent>

      <LeaveReviewModal
        open={leaveReviewOpen}
        onOpenChange={(open) => {
          setLeaveReviewOpen(open);
          if (!open) setSelectedReviewTarget(null);
        }}
        bookingId={selectedReviewTarget?.bookingId ?? null}
        lessonId={selectedReviewTarget?.lessonId ?? null}
        tutorId={selectedReviewTarget?.tutorId ?? null}
        onCreated={(created) => {
          if (created.booking_id != null) {
            setReviewsByBookingId((prev) => ({
              ...prev,
              [created.booking_id]: created,
            }));
          }
          if (created.lesson_id != null) {
            setReviewsByLessonId((prev) => ({
              ...prev,
              [created.lesson_id]: created,
            }));
          }
        }}
      />
    </Card>
  );
}


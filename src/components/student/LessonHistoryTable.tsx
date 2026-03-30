"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  addFavoriteTutor,
  getFavoriteTutorIds,
  removeFavoriteTutor,
} from "@/lib/supabase/queries/studentFavorites";
import {
  getCompletedBookingsByStudentAndLessonIds,
} from "@/lib/supabase/queries/bookings";
import { getLessonsWithRelations } from "@/lib/supabase/queries/lessons";
import { getReviewsByStudentAndBookingIds } from "@/lib/supabase/queries/reviews";
import type { LessonWithRelations } from "@/types/lesson";
import type { Review } from "@/types/review";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { toast } from "sonner";
import { Calendar, Star, StarOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import LeaveReviewModal from "@/components/student/LeaveReviewModal";

export default function LessonHistoryTable() {
  const { user } = useAuth();
  const t = useTranslations("studentProfile");
  // Keep demo-seed capability in code, but hidden by default.
  const canSeedDemo = false && process.env.NODE_ENV !== "production";

  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);

  type BookingForLesson = { bookingId: number; tutorId: string };
  const [bookingsByLessonId, setBookingsByLessonId] = useState<
    Record<number, BookingForLesson>
  >({});
  const [reviewsByBookingId, setReviewsByBookingId] = useState<
    Record<number, Review>
  >({});

  const [leaveReviewOpen, setLeaveReviewOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<{
    bookingId: number;
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
  }, [user?.id]);

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
              ? await getCompletedBookingsByStudentAndLessonIds(user.id, lessonIds)
              : [];

          if (cancelled) return;

          const nextBookingsByLessonId: Record<number, BookingForLesson> = {};
          for (const b of bookings) {
            if (b.lesson_id) {
              nextBookingsByLessonId[b.lesson_id] = {
                bookingId: b.id,
                tutorId: b.tutor_id,
              };
            }
          }
          setBookingsByLessonId(nextBookingsByLessonId);

          const bookingIds = bookings.map((b) => b.id);
          const reviews =
            bookingIds.length > 0
              ? await getReviewsByStudentAndBookingIds(user.id, bookingIds)
              : [];

          const nextReviewsByBookingId: Record<number, Review> = {};
          for (const r of reviews) {
            nextReviewsByBookingId[r.booking_id] = r;
          }
          setReviewsByBookingId(nextReviewsByBookingId);
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
    } catch (e) {
      console.error("Error toggling favorite tutor:", e);
      toast.error(t("favoriteToggleError"));
    } finally {
      setFavoriteActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-sm text-gray-500">
          Cargando...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-destructive text-sm">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
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
                  const bookingInfo = bookingsByLessonId[lesson.id];
                  const review =
                    bookingInfo && reviewsByBookingId[bookingInfo.bookingId]
                      ? reviewsByBookingId[bookingInfo.bookingId]
                      : null;

                  const tutor = lesson.tutor?.user;
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
                        ) : bookingInfo ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                              setSelectedReviewBooking({
                                bookingId: bookingInfo.bookingId,
                                tutorId: bookingInfo.tutorId,
                              });
                              setLeaveReviewOpen(true);
                            }}
                          >
                            {t("leaveReview")}
                          </Button>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => toggleFavorite(lesson.tutor_id)}
                          disabled={favoriteActionLoading === lesson.tutor_id}
                          aria-label={
                            isFavorited ? t("unfavorite") : t("favorite")
                          }
                        >
                          {isFavorited ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
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
          if (!open) setSelectedReviewBooking(null);
        }}
        bookingId={selectedReviewBooking?.bookingId ?? null}
        tutorId={selectedReviewBooking?.tutorId ?? null}
        onCreated={(created) => {
          setReviewsByBookingId((prev) => ({
            ...prev,
            [created.booking_id]: created,
          }));
        }}
      />
    </Card>
  );
}


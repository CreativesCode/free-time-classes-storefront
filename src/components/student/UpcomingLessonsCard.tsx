"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { addFavoriteTutor, getFavoriteTutorIds, removeFavoriteTutor } from "@/lib/supabase/queries/studentFavorites";
import { getLessonsWithRelations } from "@/lib/supabase/queries/lessons";
import { getBookingsByStudent } from "@/lib/supabase/queries/bookings";
import { getPublicUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import type { LessonWithRelations } from "@/types/lesson";
import { Calendar, Clock, DollarSign, Star, Video, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

function toStatusBadge(status: LessonWithRelations["status"]): {
  label: string;
  variant: "default" | "secondary";
} {
  switch (status) {
    case "scheduled":
      return { label: "Scheduled", variant: "secondary" };
    case "in_progress":
      return { label: "In Progress", variant: "secondary" };
    default:
      return { label: status, variant: "default" };
  }
}

export default function UpcomingLessonsCard(props: {
  favoritesRevision?: number;
  onFavoritesChanged?: () => void;
}) {
  const { user } = useAuth();
  const t = useTranslations("studentProfile");

  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [favoriteTutorIds, setFavoriteTutorIds] = useState<Set<string>>(
    () => new Set()
  );

  const [favoriteActionLoading, setFavoriteActionLoading] = useState<
    string | null
  >(null);
  const [cancelActionLoading, setCancelActionLoading] = useState<number | null>(null);

  const nowIso = useMemo(() => new Date().toISOString(), []);

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

    async function loadUpcoming() {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError(null);

        const [scheduled, inProgress, bookings] = await Promise.all([
          getLessonsWithRelations({
            student_id: user.id,
            status: "scheduled",
            scheduled_date_time_gte: nowIso,
          }),
          getLessonsWithRelations({
            student_id: user.id,
            status: "in_progress",
            scheduled_date_time_gte: nowIso,
          }),
          getBookingsByStudent(user.id),
        ]);

        if (cancelled) return;

        const confirmedBookingByLessonId = new Map<number, number>();
        bookings
          .filter((b) => b.status === "confirmed" && typeof b.lesson_id === "number")
          .forEach((b) => {
            confirmedBookingByLessonId.set(b.lesson_id as number, b.id);
          });

        const combined = [...scheduled, ...inProgress].sort((a, b) => {
          const aTime = a.scheduled_date_time
            ? new Date(a.scheduled_date_time).getTime()
            : 0;
          const bTime = b.scheduled_date_time
            ? new Date(b.scheduled_date_time).getTime()
            : 0;
          return aTime - bTime;
        }).filter((lesson) => confirmedBookingByLessonId.has(lesson.id));

        setLessons(combined);
      } catch (e) {
        console.error("Error loading upcoming lessons:", e);
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load lessons");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadUpcoming();
    return () => {
      cancelled = true;
    };
  }, [user?.id, nowIso]);

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

  const cancelConfirmedBooking = async (lessonId: number) => {
    if (!user?.id) return;
    const bookings = await getBookingsByStudent(user.id);
    const booking = bookings.find(
      (item) => item.status === "confirmed" && item.lesson_id === lessonId
    );

    if (!booking) {
      toast.error(t("requests.cancelError"));
      return;
    }

    try {
      setCancelActionLoading(lessonId);
      const response = await fetch(`/api/bookings/student/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || t("cancelConfirmedError"));
      }

      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
      toast.success(t("cancelConfirmedSuccess"));
    } catch (error) {
      console.error("Error cancelling confirmed booking:", error);
      toast.error(error instanceof Error ? error.message : t("cancelConfirmedError"));
    } finally {
      setCancelActionLoading(null);
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
        <CardTitle>{t("upcomingLessons")}</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {t("noUpcomingLessons")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {lessons.map((lesson) => {
              const tutor = lesson.tutor?.user;
              const tutorProfilePicture = lesson.tutor?.user?.profile_picture;
              const tutorAvatarUrl =
                tutorProfilePicture && typeof tutorProfilePicture === "string"
                  ? tutorProfilePicture.startsWith("http")
                    ? tutorProfilePicture
                    : getPublicUrl("avatars", tutorProfilePicture)
                  : null;

              const isFavorited = favoriteTutorIds.has(lesson.tutor_id);

              const badge = toStatusBadge(lesson.status);

              return (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-3 rounded-md border border-border/60 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {tutorAvatarUrl ? (
                          <Image
                            src={tutorAvatarUrl}
                            alt={tutor?.username || "Tutor"}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-primary-800 font-semibold">
                            {(tutor?.username?.[0] || "U").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {tutor?.username ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {lesson.subject?.name ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant}>
                        {badge.label}
                      </Badge>
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
                        onClick={() => void toggleFavorite(lesson.tutor_id)}
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        {lesson.scheduled_date_time
                          ? new Date(lesson.scheduled_date_time).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {lesson.duration_minutes} {t("availabilities.minutes")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-primary-600">
                        ${lesson.price}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 gap-2">
                    <div>
                      {lesson.meet_link ? (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-violet-600 hover:bg-violet-700"
                          onClick={() => window.open(lesson.meet_link!, "_blank")}
                        >
                          <Video className="h-4 w-4" />
                          {t("joinVideoCall")}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {t("noMeetLinkYet")}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={cancelActionLoading === lesson.id}
                      onClick={() => void cancelConfirmedBooking(lesson.id)}
                    >
                      {cancelActionLoading === lesson.id
                        ? t("cancelConfirmedLoading")
                        : t("cancelConfirmed")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


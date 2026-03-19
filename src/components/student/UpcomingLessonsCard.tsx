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
import type { LessonWithRelations } from "@/types/lesson";
import { Calendar, Clock, DollarSign, Star, StarOff } from "lucide-react";
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

export default function UpcomingLessonsCard() {
  const { user } = useAuth();
  const t = useTranslations("studentProfile");

  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [favoriteTutorIds, setFavoriteTutorIds] = useState<Set<string>>(
    () => new Set()
  );
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const [favoriteActionLoading, setFavoriteActionLoading] = useState<
    string | null
  >(null);

  const nowIso = useMemo(() => new Date().toISOString(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!user?.id) return;
      try {
        setFavoritesLoading(true);
        const ids = await getFavoriteTutorIds(user.id);
        if (cancelled) return;
        setFavoriteTutorIds(new Set(ids));
      } catch (e) {
        // Favorites are optional in early stages; don't block the page.
        console.error("Error loading favorite tutors:", e);
      } finally {
        if (!cancelled) setFavoritesLoading(false);
      }
    }

    void loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

        const confirmedLessonIds = new Set(
          bookings
            .filter((b) => b.status === "confirmed" && typeof b.lesson_id === "number")
            .map((b) => b.lesson_id as number)
        );

        const combined = [...scheduled, ...inProgress].sort((a, b) => {
          const aTime = a.scheduled_date_time
            ? new Date(a.scheduled_date_time).getTime()
            : 0;
          const bTime = b.scheduled_date_time
            ? new Date(b.scheduled_date_time).getTime()
            : 0;
          return aTime - bTime;
        }).filter((lesson) => confirmedLessonIds.has(lesson.id));

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
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle>{t("upcomingLessons")}</CardTitle>
        {favoritesLoading ? (
          <Badge variant="secondary">{t("loadingFavorites")}</Badge>
        ) : null}
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
                  className="border rounded-lg p-4 bg-white flex flex-col gap-3"
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
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => toggleFavorite(lesson.tutor_id)}
                        disabled={!!favoriteActionLoading}
                        aria-label={isFavorited ? t("unfavorite") : t("favorite")}
                      >
                        {isFavorited ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


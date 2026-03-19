"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  addFavoriteTutor,
  getFavoriteTutorIds,
  removeFavoriteTutor,
} from "@/lib/supabase/queries/studentFavorites";
import { getLessonsWithRelations } from "@/lib/supabase/queries/lessons";
import type { LessonWithRelations } from "@/types/lesson";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import { toast } from "sonner";
import { Calendar, Star, StarOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export default function LessonHistoryTable() {
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
                  <th className="pb-2 font-medium">Favorito</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
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
      </CardContent>
    </Card>
  );
}


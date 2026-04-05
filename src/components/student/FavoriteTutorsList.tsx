"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import {
  type FavoriteTutorWithProfile,
  getFavoriteTutorsWithProfile,
  removeFavoriteTutor,
} from "@/lib/supabase/queries/studentFavorites";
import { getPublicUrl } from "@/lib/supabase/storage";
import { toast } from "sonner";
import { StarOff } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function FavoriteTutorsList(props: {
  /** Al cambiar, se vuelve a cargar la lista (p. ej. favorito desde el historial). */
  favoritesRevision?: number;
  /** Tras quitar un favorito aquí, notifica para actualizar otras vistas. */
  onFavoritesChanged?: () => void;
}) {
  const { user } = useAuth();
  const t = useTranslations("studentProfile");

  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<FavoriteTutorWithProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getFavoriteTutorsWithProfile(user.id);
      setTutors(data);
    } catch (e) {
      console.error("Error loading favorite tutors:", e);
      setError(e instanceof Error ? e.message : "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, props.favoritesRevision]);

  const handleRemove = async (favoriteTutorId: string) => {
    if (!user?.id || removingId) return;
    try {
      setRemovingId(favoriteTutorId);
      await removeFavoriteTutor(user.id, favoriteTutorId);
      toast.success(t("favoriteRemoved"));
      setTutors((prev) =>
        prev.filter((row) => row.favoriteTutorId !== favoriteTutorId)
      );
      props.onFavoritesChanged?.();
    } catch (e) {
      console.error("Error removing favorite tutor:", e);
      toast.error(t("favoriteToggleError"));
    } finally {
      setRemovingId(null);
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
        <CardTitle>{t("favoriteTutors")}</CardTitle>
      </CardHeader>
      <CardContent>
        {tutors.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            {t("noFavoriteTutors")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutors.map((tutor) => {
              const avatarPath = tutor.user.profile_picture;
              const fid = tutor.favoriteTutorId;
              const avatarUrl =
                avatarPath && typeof avatarPath === "string"
                  ? avatarPath.startsWith("http")
                    ? avatarPath
                    : getPublicUrl("avatars", avatarPath)
                  : null;

              return (
                <div
                  key={fid}
                  className="border rounded-lg p-4 bg-white flex items-start gap-4"
                >
                  <div className="relative h-14 w-14 rounded-full overflow-hidden bg-gray-100">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={tutor.user.username || "Tutor"}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary-800 font-semibold">
                        {(tutor.user.username?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {tutor.user.username ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {tutor.user.email ?? ""}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="relative z-10 h-9 w-9 shrink-0"
                        onClick={() => void handleRemove(fid)}
                        disabled={removingId === fid}
                        aria-label={t("unfavorite")}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        ${tutor.hourly_rate ?? 0}/h
                      </Badge>
                      <Badge variant="secondary">
                        {tutor.rating?.toFixed(1) ?? "0.0"} ★ ({tutor.total_reviews ?? 0})
                      </Badge>
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


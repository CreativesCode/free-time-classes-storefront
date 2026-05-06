"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { StudentSidebarNav } from "@/components/ds/StudentSidebarNav";
import { useAuth } from "@/context/UserContext";
import { useTranslations } from "@/i18n/translations";
import {
  type FavoriteTutorWithProfile,
  getFavoriteTutorsWithProfile,
  removeFavoriteTutor,
} from "@/lib/supabase/queries/studentFavorites";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";

function resolveAvatarUrl(pic: string | null | undefined): string | null {
  if (pic == null || typeof pic !== "string") return null;
  const trimmed = pic.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return getPublicUrl("avatars", trimmed);
}

function TutorAvatar({
  pic,
  displayName,
  size = 56,
}: {
  pic: string | null | undefined;
  displayName: string;
  size?: number;
}) {
  const [hideImage, setHideImage] = useState(false);
  const url = useMemo(() => resolveAvatarUrl(pic), [pic]);
  const initials = (displayName.trim()[0] ?? "T").toUpperCase();

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      {url && !hideImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={displayName}
          className="h-full w-full object-cover"
          onError={() => setHideImage(true)}
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center text-base font-semibold text-white"
          style={{ backgroundColor: getAvatarColor(displayName) }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export default function SavedTutorsClient({ locale }: { locale: string }) {
  const t = useTranslations("savedTutors");
  const tStudent = useTranslations("studentProfile");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [tutors, setTutors] = useState<FavoriteTutorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFavoriteTutorsWithProfile(user.id);
        if (!cancelled) setTutors(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, t]);

  const handleRemove = async (favoriteTutorId: string) => {
    if (!user?.id || removingId) return;
    try {
      setRemovingId(favoriteTutorId);
      await removeFavoriteTutor(user.id, favoriteTutorId);
      setTutors((prev) =>
        prev.filter((row) => row.favoriteTutorId !== favoriteTutorId)
      );
      toast.success(tStudent("favoriteRemoved"));
    } catch {
      toast.error(tStudent("favoriteToggleError"));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl lg:px-9 lg:py-8">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <StudentSidebarNav isTutor={false} />

        <div className="min-w-0">
          <header className="px-5 pb-4 pt-[18px] md:px-9 md:pt-8 lg:px-0 lg:pt-0">
            <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-ft-ink md:text-[32px]">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-[13px] text-ft-ink-3 md:text-sm">
              {t("subtitle")}
            </p>
          </header>

          <div className="px-5 pb-12 md:px-9 lg:px-0">
            {loading ? (
              <div className="grid h-40 place-items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ft-line border-t-ft-ink" />
              </div>
            ) : error ? (
              <div className="rounded-ft-lg border border-ft-line bg-ft-paper p-6 text-center text-sm text-ft-ink-2">
                {error}
              </div>
            ) : tutors.length === 0 ? (
              <div className="rounded-ft-2xl border border-ft-line bg-gradient-to-br from-ft-surface-2 to-ft-surface-1 px-6 py-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-ft-line bg-ft-paper">
                  <Heart width={20} height={20} className="text-ft-ink-3" />
                </div>
                <p className="mt-4 text-base font-semibold text-ft-ink">
                  {t("emptyTitle")}
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-ft-ink-3">
                  {t("emptyHint")}
                </p>
                <Link
                  href={`/${locale}/tutors`}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-ft-ink px-5 py-2.5 text-sm font-semibold text-ft-paper transition-opacity hover:opacity-90"
                >
                  <Search width={14} height={14} />
                  {t("browseTutors")}
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tutors.map((tutor) => {
                  const tutorUser = tutor.user;
                  const displayName = tutorUser?.username ?? "—";
                  const rating = tutor.rating ?? 0;
                  const price = tutor.hourly_rate;
                  const fid = tutor.favoriteTutorId;

                  return (
                    <div
                      key={fid}
                      className="relative flex items-center gap-3.5 rounded-ft-lg border border-ft-line-soft bg-ft-paper p-3.5 transition-colors hover:bg-ft-paper-deep"
                    >
                      <Link
                        href={`/${locale}/tutors/${tutor.id}`}
                        className="absolute inset-0 rounded-ft-lg"
                        aria-label={displayName}
                      />
                      <TutorAvatar
                        pic={tutorUser?.profile_picture}
                        displayName={displayName}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold tracking-tight text-ft-ink">
                          {displayName}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ft-ink-3">
                          {rating > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Star
                                width={11}
                                height={11}
                                className="text-ft-accent"
                                fill="currentColor"
                                stroke="none"
                              />
                              {rating.toFixed(1)}
                              {tutor.total_reviews ? (
                                <span className="opacity-75">
                                  · {tutor.total_reviews}
                                </span>
                              ) : null}
                            </span>
                          )}
                          {tutorUser?.country && (
                            <>
                              {rating > 0 && <span>·</span>}
                              <span className="inline-flex items-center gap-1 truncate">
                                <MapPin width={11} height={11} />
                                {tutorUser.country}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {price != null && (
                        <div className="text-right">
                          <div className="text-sm font-semibold text-ft-ink">
                            {price}€
                          </div>
                          <div className="text-[10px] text-ft-ink-3">
                            {t("perHour")}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleRemove(fid);
                        }}
                        disabled={removingId === fid}
                        aria-label={tStudent("unfavorite")}
                        className="relative z-10 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-ft-line bg-ft-paper text-ft-accent-deep transition-colors hover:bg-ft-surface-1 disabled:opacity-50"
                      >
                        <Heart
                          width={14}
                          height={14}
                          fill="currentColor"
                          stroke="none"
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

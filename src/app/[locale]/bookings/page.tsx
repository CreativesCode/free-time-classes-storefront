"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  BookOpen,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Video,
  ExternalLink,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

interface Booking {
  id: number;
  student_id: string;
  tutor_id: string;
  lesson_id?: number | null;
  status: BookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  lesson?: {
    id: number;
    scheduled_date_time: string;
    duration_minutes: number;
    price: number;
    status: string;
    meet_link?: string | null;
    subject?: { name: string } | null;
    tutor?: {
      id: string;
      user?: {
        id: string;
        username: string;
        profile_picture?: string | null;
      } | null;
    } | null;
    student?: {
      id: string;
      username: string;
      profile_picture?: string | null;
    } | null;
  } | null;
}

type FilterTab = "all" | BookingStatus;
type ViewRole = "student" | "tutor";

const STATUS_CONFIG: Record<
  BookingStatus,
  { color: string; icon: React.ElementType }
> = {
  pending: { color: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  confirmed: { color: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle },
  completed: { color: "border-sky-200 bg-sky-50 text-sky-700", icon: CheckCircle },
  cancelled: { color: "border-rose-200 bg-rose-50 text-rose-700", icon: XCircle },
  rejected: { color: "border-rose-200 bg-rose-50 text-rose-700", icon: XCircle },
};

const FILTER_TABS: FilterTab[] = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("bookingsPage");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const isBothRoles = !!user?.is_student && !!user?.is_tutor;
  const [viewRole, setViewRole] = useState<ViewRole>("student");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (user) {
      if (user.is_student) setViewRole("student");
      else if (user.is_tutor) setViewRole("tutor");
    }
  }, [user]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (viewRole === "student") {
        const { data, error: fetchError } = await supabase
          .from("bookings")
          .select(
            `
            *,
            lesson:lessons(
              id, scheduled_date_time, duration_minutes, price, status, meet_link,
              subject:subjects(name),
              tutor:tutor_profiles!lessons_tutor_id_fkey(
                id,
                user:users!tutor_profiles_id_fkey(id, username, profile_picture)
              )
            )
          `
          )
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setBookings((data as Booking[]) ?? []);
      } else {
        const { data, error: fetchError } = await supabase
          .from("bookings")
          .select(
            `
            *,
            lesson:lessons(
              id, scheduled_date_time, duration_minutes, price, status, meet_link,
              subject:subjects(name),
              student:users!bookings_student_id_fkey(id, username, profile_picture)
            )
          `
          )
          .eq("tutor_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        const mapped = (data ?? []).map((b: Record<string, unknown>) => {
          const lesson = b.lesson as Record<string, unknown> | null;
          return {
            ...b,
            lesson: lesson
              ? {
                  ...lesson,
                  student: lesson.student as Booking["lesson"] extends infer L
                    ? L extends { student?: unknown }
                      ? L["student"]
                      : never
                    : never,
                }
              : null,
          };
        }) as Booking[];

        setBookings(mapped);
      }
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [user, viewRole, t]);

  useEffect(() => {
    if (user) void fetchBookings();
  }, [user, fetchBookings]);

  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" as BookingStatus } : b
        )
      );
      toast.success(t("cancelSuccess"));
    } catch {
      toast.error(t("cancelError"));
    } finally {
      setCancellingId(null);
    }
  };

  function getPersonName(booking: Booking): string {
    if (viewRole === "student") {
      return (
        booking.lesson?.tutor?.user?.username ?? t("tutor")
      );
    }
    return (
      (booking.lesson as Record<string, unknown>)?.student as { username?: string }
    )?.username ?? t("student");
  }

  function getPersonAvatar(booking: Booking): string | null {
    if (viewRole === "student") {
      const pic = booking.lesson?.tutor?.user?.profile_picture;
      return pic ? getPublicUrl("avatars", pic) : null;
    }
    const student = (booking.lesson as Record<string, unknown>)
      ?.student as { profile_picture?: string | null } | null;
    const pic = student?.profile_picture;
    return pic ? getPublicUrl("avatars", pic) : null;
  }

  function formatDateTime(isoStr: string): { date: string; time: string } {
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString(locale, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const countsByStatus: Record<BookingStatus, number> = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  return (
    <div className="relative mx-auto w-full max-w-screen-2xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-10">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-white via-violet-50/60 to-fuchsia-50/50 p-5 shadow-[0_18px_60px_rgba(112,42,225,0.08)] md:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Calendar className="h-3.5 w-3.5" />
              FreeTime Lumina
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 md:hidden">
              {t("title")}
            </h1>
            <h1 className="hidden text-4xl font-extrabold tracking-tight text-zinc-900 md:block lg:hidden">
              {t("title")}
            </h1>
            <h1 className="hidden text-5xl font-extrabold tracking-tight text-zinc-900 lg:block">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-sm text-zinc-600 md:text-base">{t("subtitle")}</p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
            <div className="rounded-lg border border-violet-100 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("filterPending")}</p>
              <p className="mt-1 text-2xl font-black text-violet-700">{countsByStatus.pending}</p>
            </div>
            <div className="rounded-lg border border-violet-100 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("filterConfirmed")}</p>
              <p className="mt-1 text-2xl font-black text-violet-700">{countsByStatus.confirmed}</p>
            </div>
            <div className="rounded-lg border border-violet-100 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("filterCompleted")}</p>
              <p className="mt-1 text-2xl font-black text-violet-700">{countsByStatus.completed}</p>
            </div>
          </div>
        </div>
      </section>

      {isBothRoles && (
        <div className="mt-6 flex gap-2 rounded-full border border-violet-100 bg-violet-50/70 p-1.5 w-fit">
          <Button
            variant={viewRole === "student" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewRole("student")}
            className="rounded-full px-4"
          >
            <User className="h-4 w-4" />
            {t("student")}
          </Button>
          <Button
            variant={viewRole === "tutor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewRole("tutor")}
            className="rounded-full px-4"
          >
            <BookOpen className="h-4 w-4" />
            {t("tutor")}
          </Button>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 shrink-0 text-zinc-500" />
        {FILTER_TABS.map((tab) => {
          const filterKey =
            tab === "all"
              ? "filterAll"
              : tab === "pending"
                ? "filterPending"
                : tab === "confirmed"
                  ? "filterConfirmed"
                  : tab === "completed"
                    ? "filterCompleted"
                    : "filterCancelled";
          return (
            <Button
              key={tab}
              variant={filter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab)}
              className="whitespace-nowrap rounded-full"
            >
              {t(filterKey)}
              {tab !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({bookings.filter((b) => b.status === tab).length})
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-3xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <div className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-2/3 rounded bg-violet-100" />
                    <div className="h-3 w-1/3 rounded bg-violet-100" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full rounded bg-violet-100" />
                <div className="h-3 w-3/4 rounded bg-violet-100" />
                <div className="h-3 w-1/2 rounded bg-violet-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void fetchBookings()}
              >
                {t("filterAll")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredBookings.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-violet-200 bg-white/70 p-10 text-center md:p-14">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
            <Calendar className="h-10 w-10 text-violet-500" />
          </div>
          <p className="mb-2 text-xl font-bold text-zinc-900">{t("noBookings")}</p>
          <p className="mx-auto mb-6 max-w-sm text-sm text-zinc-500">{t("noBookingsHint")}</p>
          <Button
            onClick={() => router.push(`/${locale}/courses`)}
            className="rounded-full px-6"
          >
            <BookOpen className="h-4 w-4" />
            {t("exploreCourses")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!loading && !error && filteredBookings.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBookings.map((booking) => {
            const personName = getPersonName(booking);
            const personAvatar = getPersonAvatar(booking);
            const statusCfg = STATUS_CONFIG[booking.status];
            const StatusIcon = statusCfg.icon;
            const lesson = booking.lesson;
            const dateTime = lesson?.scheduled_date_time
              ? formatDateTime(lesson.scheduled_date_time)
              : null;

            return (
              <article
                key={booking.id}
                className="group flex h-full flex-col rounded-3xl border border-violet-100 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(112,42,225,0.12)]"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 ring-2 ring-primary/15">
                      {personAvatar && <AvatarImage src={personAvatar} alt={personName} />}
                      <AvatarFallback
                        style={{ backgroundColor: getAvatarColor(personName) }}
                        className="text-sm font-semibold text-white"
                      >
                        {personName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{personName}</p>
                      <p className="text-xs text-zinc-500">
                        {viewRole === "student" ? t("tutor") : t("student")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`gap-1 rounded-full ${statusCfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {t(
                      `status${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}` as
                        | "statusPending"
                        | "statusConfirmed"
                        | "statusRejected"
                        | "statusCancelled"
                        | "statusCompleted"
                    )}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm">
                  {lesson?.subject?.name && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                      <span className="font-medium text-zinc-900">{lesson.subject.name}</span>
                    </div>
                  )}
                  {dateTime && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Calendar className="h-4 w-4 shrink-0 text-primary" />
                      <span>{dateTime.date}</span>
                      <span className="text-zinc-400">|</span>
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{dateTime.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    {lesson?.duration_minutes && (
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <Clock className="h-4 w-4 shrink-0 text-primary" />
                        <span>
                          {lesson.duration_minutes} {t("minutes")}
                        </span>
                      </div>
                    )}
                    {lesson?.price != null && (
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-semibold text-zinc-900">${lesson.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="line-clamp-2 rounded-xl bg-violet-50 px-3 py-2 text-xs text-zinc-600">
                      {booking.notes}
                    </p>
                  )}
                </div>

                {booking.status === "confirmed" && lesson?.meet_link && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2">
                    <Video className="h-4 w-4 shrink-0 text-violet-600" />
                    <span className="flex-1 truncate text-xs text-violet-700">
                      {t("videoCallLink")}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 gap-1 rounded-full bg-violet-600 px-3 text-xs hover:bg-violet-700"
                      onClick={() => window.open(lesson.meet_link!, "_blank")}
                    >
                      {t("joinVideoCall")}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {booking.status === "confirmed" && !lesson?.meet_link && (
                  <p className="mt-3 text-xs italic text-slate-400">
                    {t("noMeetLink")}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 pt-2">
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-full"
                      disabled={cancellingId === booking.id}
                      onClick={() => void handleCancel(booking.id)}
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          {t("cancelling")}
                        </>
                      ) : (
                        t("cancelBooking")
                      )}
                    </Button>
                  )}
                  {booking.status === "completed" && viewRole === "student" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => router.push(`/${locale}/student-profile`)}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t("leaveReview")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-full text-zinc-600 group-hover:text-primary"
                    onClick={() =>
                      router.push(
                        viewRole === "student"
                          ? `/${locale}/student-profile`
                          : `/${locale}/teacher-profile`
                      )
                    }
                  >
                    {t("viewDetails")}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredBookings.length > 0 && (
        <div className="mt-6 rounded-3xl border border-violet-100 bg-violet-50/70 p-4 text-xs text-zinc-600 md:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Reserva y pago se procesan de forma segura.
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/90 px-4 pb-4 pt-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                Reservas visibles
              </p>
              <p className="text-lg font-black text-violet-900">{filteredBookings.length}</p>
            </div>
            <Button
              onClick={() => router.push(`/${locale}/courses`)}
              className="rounded-full px-5"
              size="sm"
            >
              <BookOpen className="h-4 w-4" />
              {t("exploreCourses")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

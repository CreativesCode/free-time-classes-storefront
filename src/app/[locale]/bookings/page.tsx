"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  confirmed: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  completed: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  rejected: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
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
              id, scheduled_date_time, duration_minutes, price, status,
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
              id, scheduled_date_time, duration_minutes, price, status,
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

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {/* Role toggle for dual-role users */}
      {isBothRoles && (
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewRole === "student" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewRole("student")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            {t("student")}
          </Button>
          <Button
            variant={viewRole === "tutor" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewRole("tutor")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {t("tutor")}
          </Button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
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
              className="whitespace-nowrap"
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

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
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
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && filteredBookings.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">{t("noBookings")}</CardTitle>
            <CardDescription className="max-w-sm mb-6">
              {t("noBookingsHint")}
            </CardDescription>
            <Button
              onClick={() => router.push(`/${locale}/courses`)}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {t("exploreCourses")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bookings list */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <Card
                key={booking.id}
                className="hover:shadow-md transition-shadow flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        {personAvatar && (
                          <AvatarImage src={personAvatar} alt={personName} />
                        )}
                        <AvatarFallback
                          style={{
                            backgroundColor: getAvatarColor(personName),
                          }}
                          className="text-white font-semibold text-sm"
                        >
                          {personName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {personName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {viewRole === "student" ? t("tutor") : t("student")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 flex items-center gap-1 text-xs ${statusCfg.color}`}
                    >
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
                </CardHeader>

                <CardContent className="flex-1 space-y-3 text-sm">
                  {/* Subject */}
                  {lesson?.subject?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span className="font-medium text-foreground">
                        {lesson.subject.name}
                      </span>
                    </div>
                  )}

                  {/* Date & Time */}
                  {dateTime && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{dateTime.date}</span>
                      <span className="text-muted-foreground/60">|</span>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{dateTime.time}</span>
                    </div>
                  )}

                  {/* Duration & Price */}
                  <div className="flex items-center gap-4">
                    {lesson?.duration_minutes && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>
                          {lesson.duration_minutes} {t("minutes")}
                        </span>
                      </div>
                    )}
                    {lesson?.price != null && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        <span className="font-semibold text-foreground">
                          ${lesson.price.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 line-clamp-2">
                      {booking.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex gap-2 flex-wrap">
                    {(booking.status === "pending" ||
                      booking.status === "confirmed") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancellingId === booking.id}
                        onClick={() => void handleCancel(booking.id)}
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            {t("cancelling")}
                          </>
                        ) : (
                          t("cancelBooking")
                        )}
                      </Button>
                    )}
                    {booking.status === "completed" &&
                      viewRole === "student" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/${locale}/student-profile`)
                          }
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("leaveReview")}
                        </Button>
                      )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto flex items-center gap-1 text-muted-foreground"
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

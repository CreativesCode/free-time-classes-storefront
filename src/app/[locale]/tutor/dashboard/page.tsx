"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor } from "@/lib/utils";
import {
  createBookingRejection,
  getBookingsByTutor,
  updateBooking,
} from "@/lib/supabase/queries/bookings";
import { getLessonWithRelations, updateLesson } from "@/lib/supabase/queries/lessons";
import type {
  Booking,
  BookingRejectionReason,
} from "@/types/booking";
import type { LessonWithRelations } from "@/types/lesson";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ChevronDown,
  MessageSquare,
  Loader2,
} from "lucide-react";

type PendingBookingItem = {
  booking: Booking;
  lesson: LessonWithRelations | null;
};

interface TodayLesson {
  id: number;
  scheduled_date_time: string;
  duration_minutes: number;
  price: number;
  status: string;
  subject: { name: string } | null;
  student: { id: string; user: { username: string } | null } | null;
}

interface DashboardStats {
  classesThisMonth: number;
  pendingRequests: number;
  avgRating: number | null;
  earningsThisMonth: number;
}

const REJECTION_REASONS: Array<{
  value: BookingRejectionReason;
  translationKey: string;
}> = [
  { value: "tutor unavailable", translationKey: "tutorUnavailable" },
  { value: "sick tutor", translationKey: "sickTutor" },
  { value: "sick student", translationKey: "sickStudent" },
  { value: "scheduling conflict", translationKey: "schedulingConflict" },
  { value: "emergency", translationKey: "emergency" },
  { value: "technical issues", translationKey: "technicalIssues" },
  { value: "other", translationKey: "other" },
];

export default function TutorDashboardPage() {
  const t = useTranslations("tutorDashboardPage");
  const td = useTranslations("dashboard");
  const locale = useLocale();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingBookingItem[]>([]);
  const [actionLoadingBookingId, setActionLoadingBookingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState<BookingRejectionReason>("tutor unavailable");

  const [stats, setStats] = useState<DashboardStats>({
    classesThisMonth: 0,
    pendingRequests: 0,
    avgRating: null,
    earningsThisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [todayLessons, setTodayLessons] = useState<TodayLesson[]>([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);

  const loadPending = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const bookings = await getBookingsByTutor(user.id);
      const pendingBookings = bookings.filter(
        (b) => b.status === "pending" && typeof b.lesson_id === "number"
      );

      const items = await Promise.all(
        pendingBookings.map(async (booking) => {
          const lesson =
            typeof booking.lesson_id === "number"
              ? await getLessonWithRelations(booking.lesson_id)
              : null;

          return { booking, lesson } satisfies PendingBookingItem;
        })
      );

      setPendingItems(items);
    } catch (e) {
      console.error("Error loading pending bookings:", e);
      toast.error(t("loadingError"));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    setStatsLoading(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [lessonsRes, profileRes, pendingRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("price, duration_minutes")
          .eq("tutor_id", user.id)
          .eq("status", "completed")
          .gte("scheduled_date_time", startOfMonth),
        supabase
          .from("tutor_profiles")
          .select("rating")
          .eq("id", user.id)
          .single(),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("tutor_id", user.id)
          .eq("status", "pending"),
      ]);

      const monthLessons = lessonsRes.data ?? [];
      const totalEarnings = monthLessons.reduce((sum, l) => sum + (l.price ?? 0), 0);

      setStats({
        classesThisMonth: monthLessons.length,
        pendingRequests: pendingRes.count ?? 0,
        avgRating: profileRes.data?.rating ?? null,
        earningsThisMonth: totalEarnings,
      });
    } catch (e) {
      console.error("Error loading stats:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTodayLessons = async () => {
    if (!user?.id) return;

    setTodayLoading(true);
    try {
      const supabase = createClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("lessons")
        .select(
          "id, scheduled_date_time, duration_minutes, price, status, subject:subjects(name), student:student_profiles!lessons_student_id_fkey(id, user:users!student_profiles_id_fkey(username))"
        )
        .eq("tutor_id", user.id)
        .in("status", ["confirmed", "scheduled"])
        .gte("scheduled_date_time", todayStart.toISOString())
        .lte("scheduled_date_time", todayEnd.toISOString())
        .order("scheduled_date_time", { ascending: true });

      setTodayLessons((data as unknown as TodayLesson[]) ?? []);
    } catch (e) {
      console.error("Error loading today lessons:", e);
    } finally {
      setTodayLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
    void loadStats();
    void loadTodayLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openRejectDialog = (item: PendingBookingItem) => {
    setRejectTarget(item);
    setRejectReason("tutor unavailable");
    setRejectDialogOpen(true);
  };

  const handleConfirm = async (booking: Booking) => {
    if (!user?.id) return;
    if (typeof booking.lesson_id !== "number") return;

    setActionLoadingBookingId(booking.id);
    try {
      await updateBooking(booking.id, { status: "confirmed" });

      toast.success(t("confirmSuccess"));
      await loadPending();
    } catch (e) {
      console.error("Error confirming booking:", e);
      toast.error(t("confirmError"));
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !user?.id) return;
    if (typeof rejectTarget.booking.lesson_id !== "number") return;

    const { booking } = rejectTarget;
    const lessonId = booking.lesson_id;
    if (typeof lessonId !== "number") return;

    setActionLoadingBookingId(booking.id);
    try {
      await updateBooking(booking.id, { status: "rejected" });

      await createBookingRejection({
        booking_id: booking.id,
        student_id: booking.student_id,
        tutor_id: booking.tutor_id,
        reason: rejectReason,
      });

      await updateLesson(lessonId, {
        student_id: null,
        status: "available",
      });

      setRejectDialogOpen(false);
      setRejectTarget(null);

      toast.success(t("rejectSuccess"));
      await loadPending();
    } catch (e) {
      console.error("Error rejecting booking:", e);
      toast.error(t("rejectError"));
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statCards = [
    {
      label: td("classesThisMonth"),
      value: stats.classesThisMonth,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
      accent: "border-blue-200",
    },
    {
      label: td("pendingRequests"),
      value: stats.pendingRequests,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
      accent: "border-amber-200",
    },
    {
      label: td("avgRating"),
      value: stats.avgRating != null ? stats.avgRating.toFixed(1) : "—",
      icon: Star,
      color: "bg-purple-100 text-purple-600",
      accent: "border-purple-200",
      suffix: stats.avgRating != null ? "/5" : "",
    },
    {
      label: td("monthlyEarnings"),
      value: `$${stats.earningsThisMonth.toFixed(0)}`,
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-600",
      accent: "border-emerald-200",
    },
  ];

  const quickActions = [
    {
      label: td("manageAvailability"),
      href: `/${locale}/teacher-profile`,
      icon: Calendar,
      description: td("manageAvailability"),
    },
    {
      label: td("browseCourses"),
      href: `/${locale}/courses`,
      icon: BookOpen,
      description: td("browseCourses"),
    },
    {
      label: td("myMessages"),
      href: `/${locale}/messages`,
      icon: MessageSquare,
      description: td("myMessages"),
    },
    {
      label: td("viewProfile"),
      href: `/${locale}/teacher-profile`,
      icon: Users,
      description: td("viewProfile"),
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {td("tutorDashboard")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {td("welcomeSubtitle")}
          </p>
        </div>
        {stats.pendingRequests > 0 && (
          <Badge variant="destructive" className="self-start sm:self-auto text-sm px-3 py-1">
            {stats.pendingRequests} {t("pending")}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`border ${stat.accent} transition-shadow hover:shadow-md`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-1 text-muted-foreground" />
                ) : (
                  <p className="text-lg font-bold leading-tight">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {stat.suffix}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
              {td("todaySchedule")}
            </CardTitle>
            <Link href={`/${locale}/teacher-profile`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                {td("viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : todayLessons.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">{td("noClassesToday")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLessons.map((lesson) => {
                const studentName =
                  lesson.student?.user?.username ?? "—";
                const initials = studentName.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback
                        className="text-xs font-semibold text-white"
                        style={{ backgroundColor: getAvatarColor(studentName) }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {lesson.subject?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {studentName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {formatTime(lesson.scheduled_date_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.duration_minutes} min
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            {td("quickActions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.href + action.label} href={action.href}>
                <div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:bg-muted/50 hover:shadow-sm cursor-pointer h-full">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium leading-tight">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Bookings (collapsible) */}
      <Card className="w-full">
        <CardHeader
          className="flex flex-row items-start justify-between gap-4 cursor-pointer select-none"
          onClick={() => setPendingOpen((prev) => !prev)}
        >
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              {t("title")}
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  pendingOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </CardTitle>
            <p className="text-sm text-gray-600">{t("description")}</p>
          </div>
          <Badge variant="secondary">
            {pendingItems.length} {t("pending")}
          </Badge>
        </CardHeader>

        {pendingOpen && (
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-gray-500">{t("loading")}</span>
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                {t("noPendingBookings")}
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingItems.map(({ booking, lesson }) => {
                  const scheduledLabel =
                    lesson?.scheduled_date_time
                      ? new Date(lesson.scheduled_date_time).toLocaleString()
                      : "—";

                  const studentName =
                    lesson?.student?.user?.username ?? booking.student_id;

                  return (
                    <div
                      key={booking.id}
                      className="border rounded-lg p-4 bg-white space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {lesson?.subject?.name ?? t("lessonUnknown")}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {t("student")}: {studentName}
                          </div>
                        </div>
                        <Badge variant="secondary">{t("pending")}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                        <div>
                          <div className="text-gray-500">{t("scheduledAt")}</div>
                          <div>{scheduledLabel}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t("duration")}</div>
                          <div>
                            {lesson?.duration_minutes ?? "—"} {t("minutes")}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t("price")}</div>
                          <div>${lesson?.price ?? "—"}</div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          onClick={() => openRejectDialog({ booking, lesson })}
                          disabled={actionLoadingBookingId === booking.id}
                        >
                          {t("reject")}
                        </Button>
                        <Button
                          onClick={() => handleConfirm(booking)}
                          disabled={actionLoadingBookingId === booking.id}
                        >
                          {t("accept")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
          </DialogHeader>

          {rejectTarget ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("rejectReason")}</Label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as BookingRejectionReason)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {t(`rejectionReasons.${r.translationKey}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>{t("notesOptional")}</Label>
                <Input
                  placeholder={t("notesOptionalPlaceholder")}
                  value={rejectTarget.booking.notes ?? ""}
                  disabled
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  {t("cancelReject")}
                </Button>
                <Button
                  onClick={() => void handleReject()}
                  disabled={actionLoadingBookingId === rejectTarget.booking.id}
                >
                  {t("confirmReject")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

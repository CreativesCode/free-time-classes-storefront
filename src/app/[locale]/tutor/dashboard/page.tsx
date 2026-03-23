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

  const greetingName = user?.email?.split("@")[0] ?? "Tutor";
  const todayLabel = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-24 md:pb-10">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">{todayLabel}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:hidden">
              {td("tutorDashboard")}
            </h1>
            <h1 className="mt-1 hidden text-4xl font-extrabold tracking-tight text-slate-900 md:block lg:text-5xl">
              {td("tutorDashboard")}
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              {td("welcomeSubtitle")} {greetingName}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white p-1 shadow-sm">
            <Button size="sm" className="rounded-lg bg-violet-600 hover:bg-violet-700">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg text-slate-600">
              Performance
            </Button>
          </div>
        </div>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className={`min-w-[220px] border ${stat.accent} bg-white/90 backdrop-blur transition-shadow hover:shadow-md md:min-w-0`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                {statsLoading ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-lg font-bold leading-tight text-slate-900">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-xs font-normal text-muted-foreground">{stat.suffix}</span>
                    )}
                  </p>
                )}
                <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                  {index < 2 ? "+12% vs mes pasado" : "Actualizado hoy"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/90 px-4 pb-4 pt-3 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-500">
              Pendientes
            </p>
            <p className="text-lg font-black text-violet-900">{pendingItems.length}</p>
          </div>
          <Button
            size="sm"
            className="rounded-full px-5"
            onClick={() => setPendingOpen(true)}
          >
            {t("title")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="border-violet-100">
            <CardHeader
              className="flex cursor-pointer flex-row items-start justify-between gap-4 select-none"
              onClick={() => setPendingOpen((prev) => !prev)}
            >
              <div className="flex-1 space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {t("title")}
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      pendingOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </CardTitle>
                <p className="text-sm text-gray-600">{t("description")}</p>
              </div>
              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                {pendingItems.length} {t("pending")}
              </Badge>
            </CardHeader>

            {pendingOpen && (
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-gray-500">{t("loading")}</span>
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">{t("noPendingBookings")}</div>
                ) : (
                  <div className="grid gap-3">
                    {pendingItems.map(({ booking, lesson }) => {
                      const scheduledLabel = lesson?.scheduled_date_time
                        ? new Date(lesson.scheduled_date_time).toLocaleString(locale)
                        : "—";
                      const studentName = lesson?.student?.user?.username ?? booking.student_id;
                      const initials = studentName.slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={booking.id}
                          className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarFallback
                                  className="text-xs font-semibold text-white"
                                  style={{ backgroundColor: getAvatarColor(studentName) }}
                                >
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {lesson?.subject?.name ?? t("lessonUnknown")}
                                </p>
                                <p className="truncate text-xs text-slate-600">
                                  {t("student")}: {studentName}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">{t("pending")}</Badge>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-3">
                            <div className="rounded-lg bg-white/80 p-2">
                              <p className="text-xs text-slate-500">{t("scheduledAt")}</p>
                              <p className="font-medium">{scheduledLabel}</p>
                            </div>
                            <div className="rounded-lg bg-white/80 p-2">
                              <p className="text-xs text-slate-500">{t("duration")}</p>
                              <p className="font-medium">
                                {lesson?.duration_minutes ?? "—"} {t("minutes")}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white/80 p-2">
                              <p className="text-xs text-slate-500">{t("price")}</p>
                              <p className="font-medium">${lesson?.price ?? "—"}</p>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-violet-100 pt-2">
                            <Button
                              variant="outline"
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => openRejectDialog({ booking, lesson })}
                              disabled={actionLoadingBookingId === booking.id}
                            >
                              {t("reject")}
                            </Button>
                            <Button
                              className="bg-violet-600 hover:bg-violet-700"
                              onClick={() => handleConfirm(booking)}
                              disabled={actionLoadingBookingId === booking.id}
                            >
                              {actionLoadingBookingId === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                t("accept")
                              )}
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

          <Card className="border-violet-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-5 w-5 text-violet-600" />
                  {td("todaySchedule")}
                </CardTitle>
                <Link href={`/${locale}/teacher-profile`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-violet-700">
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
                  <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{td("noClassesToday")}</p>
                </div>
              ) : (
                <div className="relative space-y-3 pl-4 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[2px] before:bg-violet-100">
                  {todayLessons.map((lesson, idx) => {
                    const studentName = lesson.student?.user?.username ?? "—";
                    const isCurrent = idx === 0;
                    return (
                      <div
                        key={lesson.id}
                        className={`relative rounded-xl border p-4 ${
                          isCurrent
                            ? "border-violet-200 bg-violet-50 shadow-sm"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span
                          className={`absolute -left-[23px] top-5 h-3 w-3 rounded-full border-2 border-white ${
                            isCurrent ? "bg-violet-600" : "bg-slate-300"
                          }`}
                        />
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            {isCurrent ? (
                              <span className="mb-1 inline-block rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                En vivo
                              </span>
                            ) : null}
                            <p className="text-xs font-semibold text-violet-700">
                              {formatTime(lesson.scheduled_date_time)} · {lesson.duration_minutes} min
                            </p>
                            <p className="truncate text-base font-semibold text-slate-900">
                              {lesson.subject?.name ?? "—"}
                            </p>
                            <p className="truncate text-sm text-slate-600">{studentName}</p>
                          </div>
                          <Button
                            variant={isCurrent ? "default" : "outline"}
                            className={isCurrent ? "bg-violet-600 hover:bg-violet-700" : ""}
                          >
                            {isCurrent ? "Reanudar" : "Ver detalles"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="border-violet-200 bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-300/40">
            <CardHeader>
              <CardTitle className="text-lg">Ganancias Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex h-28 items-end gap-2">
                {[38, 56, 50, 75, 64, 90].map((height, idx) => (
                  <div key={height} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-md ${
                        idx === 5 ? "bg-white" : "bg-white/35"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                <p className="text-xs text-violet-100">Mejor mes hasta ahora</p>
                <p className="text-xl font-bold">${stats.earningsThisMonth.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                {td("quickActions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.href + action.label} href={action.href}>
                    <div className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50/40 p-4 text-center transition-all hover:bg-violet-600 hover:text-white">
                      <action.icon className="h-5 w-5" />
                      <span className="text-xs font-semibold leading-tight">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tip del Mentor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm italic text-slate-600">
                &quot;Recuerda enviar materiales de apoyo al menos 24 horas antes para mejorar el
                engagement en tus clases.&quot;
              </p>
              <Button variant="ghost" className="w-full justify-center text-violet-700">
                Ver mas consejos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:max-w-[540px]">
          <DialogHeader className="px-4 pt-6 sm:px-6">
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
          </DialogHeader>

          {rejectTarget ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
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
              </div>
              <div className="mt-2 flex shrink-0 justify-end gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
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

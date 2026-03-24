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
  Video,
  Link as LinkIcon,
  Copy,
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
  meet_link: string | null;
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
  const [editingMeetLinkId, setEditingMeetLinkId] = useState<number | null>(null);
  const [editingMeetLinkValue, setEditingMeetLinkValue] = useState("");
  const [meetLinkSaving, setMeetLinkSaving] = useState(false);
  const [confirmMeetLink, setConfirmMeetLink] = useState("");

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
          "id, scheduled_date_time, duration_minutes, price, status, meet_link, subject:subjects(name), student:student_profiles!lessons_student_id_fkey(id, user:users!student_profiles_id_fkey(username))"
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

  const handleConfirm = async (booking: Booking, videoLink?: string) => {
    if (!user?.id) return;
    if (typeof booking.lesson_id !== "number") return;

    setActionLoadingBookingId(booking.id);
    try {
      const response = await fetch("/api/bookings/tutor/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          action: "confirm",
          ...(videoLink ? { meetLink: videoLink } : {}),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || t("confirmError"));

      setConfirmMeetLink("");
      toast.success(t("confirmSuccess"));
      await loadPending();
    } catch (e) {
      console.error("Error confirming booking:", e);
      toast.error(t("confirmError"));
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  const saveMeetLink = async (lessonId: number) => {
    setMeetLinkSaving(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/meet-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink: editingMeetLinkValue }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || td("meetLinkUpdateError"));

      setTodayLessons((prev) =>
        prev.map((l) =>
          l.id === lessonId
            ? { ...l, meet_link: editingMeetLinkValue.trim() || null }
            : l
        )
      );
      setEditingMeetLinkId(null);
      setEditingMeetLinkValue("");
      toast.success(td("meetLinkUpdated"));
    } catch (e) {
      console.error("Error saving meet link:", e);
      toast.error(td("meetLinkUpdateError"));
    } finally {
      setMeetLinkSaving(false);
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
    <div className="mx-auto max-w-screen-2xl pb-24 md:pb-10">
      {/* ═══════════════ MOBILE VIEW (< md) ═══════════════ */}
      <div className="space-y-6 px-4 pt-2 md:hidden">
        {/* Compact welcome */}
        <section>
          <p className="text-sm font-medium text-violet-600">{td("welcomeSubtitle")}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Hola, {greetingName}
          </h1>
        </section>

        {/* Metric cards - tall, colorful, horizontal scroll */}
        <section className="-mx-4 flex gap-3 overflow-x-auto px-4 no-scrollbar">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`flex h-36 w-40 shrink-0 flex-col justify-between rounded-2xl p-5 ${stat.color}`}
            >
              <stat.icon className="h-6 w-6" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {stat.label}
                </p>
                {statsLoading ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-xl font-extrabold">
                    {stat.value}
                    {stat.suffix && <span className="text-xs font-normal">{stat.suffix}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Pending requests - compact */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{t("title")}</h2>
            <span className="text-sm font-semibold text-violet-600">
              {pendingItems.length} {t("pending")}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : pendingItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noPendingBookings")}</p>
          ) : (
            <div className="space-y-2">
              {pendingItems.map(({ booking, lesson }) => {
                const studentName = lesson?.student?.user?.username ?? booking.student_id;
                const initials = studentName.slice(0, 2).toUpperCase();
                const timeLabel = lesson?.scheduled_date_time
                  ? formatTime(lesson.scheduled_date_time)
                  : "—";

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback
                          className="text-xs font-semibold text-white"
                          style={{ backgroundColor: getAvatarColor(studentName) }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{studentName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {lesson?.subject?.name ?? t("lessonUnknown")} &middot; {timeLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100"
                        onClick={() => openRejectDialog({ booking, lesson })}
                        disabled={actionLoadingBookingId === booking.id}
                      >
                        <span className="text-lg font-bold">✕</span>
                      </button>
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-300/40 transition-colors hover:bg-violet-700"
                        onClick={() => handleConfirm(booking)}
                        disabled={actionLoadingBookingId === booking.id}
                      >
                        {actionLoadingBookingId === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-lg font-bold">✓</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Today's agenda - timeline */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">{td("todaySchedule")}</h2>
          {todayLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : todayLessons.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{td("noClassesToday")}</p>
            </div>
          ) : (
            <div className="relative ml-3 space-y-6 border-l-2 border-violet-200/40 pl-7">
              {todayLessons.map((lesson, idx) => {
                const studentName = lesson.student?.user?.username ?? "—";
                const isCurrent = idx === 0;
                const endTime = new Date(
                  new Date(lesson.scheduled_date_time).getTime() +
                    lesson.duration_minutes * 60000
                );

                return (
                  <div key={lesson.id} className="relative">
                    <div
                      className={`absolute -left-[33px] top-1 h-3.5 w-3.5 rounded-full border-[3px] border-white ${
                        isCurrent ? "bg-violet-600" : "bg-slate-300"
                      }`}
                    />
                    <div
                      className={`rounded-2xl p-5 ${
                        isCurrent ? "bg-violet-50/80" : "bg-white/80 opacity-80"
                      }`}
                    >
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${
                          isCurrent
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {formatTime(lesson.scheduled_date_time)} -{" "}
                        {endTime.toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <h3 className="mt-2.5 text-lg font-bold text-slate-900">
                        {lesson.subject?.name ?? "—"}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback
                            className="text-[10px] font-semibold text-white"
                            style={{ backgroundColor: getAvatarColor(studentName) }}
                          >
                            {studentName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-slate-500">Con {studentName}</p>
                      </div>
                      {lesson.meet_link ? (
                        <Button
                          className="mt-4 w-full rounded-xl border border-violet-200 bg-white text-violet-600 hover:bg-violet-50"
                          onClick={() => window.open(lesson.meet_link!, "_blank")}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          {isCurrent ? td("resumeClass") : td("openVideoCall")}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="mt-4 w-full rounded-xl border-violet-200 text-violet-600"
                          onClick={() => {
                            setEditingMeetLinkId(lesson.id);
                            setEditingMeetLinkValue("");
                          }}
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          {td("addMeetLink")}
                        </Button>
                      )}

                      {editingMeetLinkId === lesson.id && (
                        <div className="mt-3 space-y-2">
                          <Input
                            type="url"
                            className="h-10 w-full text-sm"
                            value={editingMeetLinkValue}
                            onChange={(e) => setEditingMeetLinkValue(e.target.value)}
                            placeholder={t("meetLinkPlaceholder")}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              disabled={meetLinkSaving}
                              onClick={() => void saveMeetLink(lesson.id)}
                            >
                              {meetLinkSaving ? td("meetLinkSaving") : "OK"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMeetLinkId(null)}
                            >
                              {t("cancelReject")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ═══════════════ TABLET / DESKTOP VIEW (md+) ═══════════════ */}
      <div className="hidden space-y-6 md:block">
        {/* Hero card */}
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-7 shadow-sm">
          <div className="flex flex-row items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-violet-600">{todayLabel}</p>
              <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
                {td("tutorDashboard")}
              </h1>
              <p className="mt-2 text-base text-slate-600">
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

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card
              key={stat.label}
              className={`border ${stat.accent} bg-white/90 backdrop-blur transition-shadow hover:shadow-md`}
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

        {/* Main grid: content + sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Pending requests - full detail */}
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

                            <div className="grid grid-cols-3 gap-2 text-sm text-slate-700">
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

                            <div className="space-y-2 border-t border-violet-100 pt-2">
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-violet-500" />
                                <Input
                                  type="url"
                                  className="h-8 flex-1 text-xs"
                                  placeholder={t("meetLinkPlaceholder")}
                                  value={confirmMeetLink}
                                  onChange={(e) => setConfirmMeetLink(e.target.value)}
                                />
                              </div>
                              <p className="text-[11px] text-slate-500">{t("meetLinkHint")}</p>
                              <div className="flex justify-end gap-2">
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
                                  onClick={() => handleConfirm(booking, confirmMeetLink)}
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Today schedule - timeline */}
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
                          <div className="flex flex-row items-center justify-between gap-3">
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
                            <div className="flex items-center gap-2">
                              {lesson.meet_link ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => {
                                      navigator.clipboard.writeText(lesson.meet_link!);
                                      toast.success(td("meetLinkCopied"));
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={isCurrent ? "default" : "outline"}
                                    className={`gap-1 ${isCurrent ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                                    onClick={() => window.open(lesson.meet_link!, "_blank")}
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                    {isCurrent ? td("resumeClass") : td("openVideoCall")}
                                  </Button>
                                </>
                              ) : editingMeetLinkId === lesson.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="url"
                                    className="h-8 w-52 text-xs"
                                    value={editingMeetLinkValue}
                                    onChange={(e) => setEditingMeetLinkValue(e.target.value)}
                                    placeholder={t("meetLinkPlaceholder")}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    disabled={meetLinkSaving}
                                    onClick={() => void saveMeetLink(lesson.id)}
                                  >
                                    {meetLinkSaving ? td("meetLinkSaving") : "OK"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingMeetLinkId(null)}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-violet-600"
                                  onClick={() => {
                                    setEditingMeetLinkId(lesson.id);
                                    setEditingMeetLinkValue(lesson.meet_link ?? "");
                                  }}
                                >
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  {td("addMeetLink")}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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

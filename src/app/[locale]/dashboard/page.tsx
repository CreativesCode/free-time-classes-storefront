"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage";
import { getAvatarColor } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Search,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface UpcomingLessonRaw {
  id: string;
  scheduled_date_time: string;
  duration_minutes: number;
  status: string;
  subject: { name: string }[] | { name: string } | null;
  tutor:
    | {
        id: string;
        user:
          | { username: string; profile_picture: string | null }[]
          | { username: string; profile_picture: string | null }
          | null;
      }[]
    | {
        id: string;
        user:
          | { username: string; profile_picture: string | null }[]
          | { username: string; profile_picture: string | null }
          | null;
      }
    | null;
}

interface UpcomingLesson {
  id: string;
  scheduled_date_time: string;
  duration_minutes: number;
  status: string;
  subjectName: string | null;
  tutorUsername: string;
  tutorPicture: string | null;
}

interface DashboardStats {
  totalClasses: number;
  totalHours: number;
  totalTutors: number;
  pendingRequests: number;
}

export default function Dashboard() {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalHours: 0,
    totalTutors: 0,
    pendingRequests: 0,
  });
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchDashboardData = useCallback(async (userId: string) => {
    const supabase = createClient();
    setDataLoading(true);

    try {
      const [completedRes, pendingRes, upcomingRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, duration_minutes, tutor_id")
          .eq("student_id", userId)
          .eq("status", "completed"),

        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("student_id", userId)
          .eq("status", "pending"),

        supabase
          .from("lessons")
          .select(
            "id, scheduled_date_time, duration_minutes, status, subject:subjects(name), tutor:tutor_profiles!lessons_tutor_id_fkey(id, user:users!tutor_profiles_id_fkey(username, profile_picture))"
          )
          .eq("student_id", userId)
          .in("status", ["confirmed", "scheduled"])
          .gte("scheduled_date_time", new Date().toISOString())
          .order("scheduled_date_time", { ascending: true })
          .limit(3),
      ]);

      const completed = completedRes.data ?? [];
      const totalHoursValue = completed.reduce(
        (sum, l) => sum + (l.duration_minutes ?? 0),
        0
      );
      const uniqueTutors = new Set(completed.map((l) => l.tutor_id)).size;

      setStats({
        totalClasses: completed.length,
        totalHours: Math.round((totalHoursValue / 60) * 10) / 10,
        totalTutors: uniqueTutors,
        pendingRequests: pendingRes.count ?? 0,
      });

      const rawLessons = (upcomingRes.data ?? []) as UpcomingLessonRaw[];
      setUpcomingLessons(
        rawLessons.map((l) => {
          const subj = Array.isArray(l.subject) ? l.subject[0] : l.subject;
          const tut = Array.isArray(l.tutor) ? l.tutor[0] : l.tutor;
          const tutUser = tut
            ? Array.isArray(tut.user)
              ? tut.user[0]
              : tut.user
            : null;
          return {
            id: l.id,
            scheduled_date_time: l.scheduled_date_time,
            duration_minutes: l.duration_minutes,
            status: l.status,
            subjectName: subj?.name ?? null,
            tutorUsername: tutUser?.username ?? "Tutor",
            tutorPicture: tutUser?.profile_picture ?? null,
          };
        })
      );
    } catch {
      // silently handle – empty state will show
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData(user.id);
    }
  }, [user?.id, fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Error
            </CardTitle>
            <CardDescription className="text-center">
              {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push(`/${locale}/login`)}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const profilePictureUrl =
    user.profile_picture && typeof user.profile_picture === "string"
      ? user.profile_picture.startsWith("http")
        ? user.profile_picture
        : getPublicUrl("avatars", user.profile_picture)
      : null;

  const avatarColor = getAvatarColor(user.username ?? "");
  const initials = user.username?.[0]?.toUpperCase() ?? "U";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statCards = [
    {
      label: t("totalClasses"),
      value: stats.totalClasses,
      icon: BookOpen,
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50 dark:bg-blue-950/40",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: t("totalHours"),
      value: stats.totalHours,
      icon: Clock,
      gradient: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("totalTutors"),
      value: stats.totalTutors,
      icon: Users,
      gradient: "from-violet-500 to-violet-600",
      bgLight: "bg-violet-50 dark:bg-violet-950/40",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: t("pendingRequests"),
      value: stats.pendingRequests,
      icon: Calendar,
      gradient: "from-amber-500 to-amber-600",
      bgLight: "bg-amber-50 dark:bg-amber-950/40",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const quickActions = [
    {
      label: t("findTutor"),
      icon: Search,
      href: `/${locale}/tutors`,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      label: t("browseCourses"),
      icon: GraduationCap,
      href: `/${locale}/courses`,
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      label: t("myBookings"),
      icon: Calendar,
      href: `/${locale}/bookings`,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: t("myMessages"),
      icon: MessageSquare,
      href: `/${locale}/messages`,
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  const getTutorAvatar = (lesson: UpcomingLesson) => {
    const pic = lesson.tutorPicture;
    if (!pic) return null;
    return pic.startsWith("http") ? pic : getPublicUrl("avatars", pic);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-10 space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-white dark:ring-slate-800 shadow-lg">
              {profilePictureUrl ? (
                <AvatarImage src={profilePictureUrl} alt={user.username ?? ""} />
              ) : null}
              <AvatarFallback
                style={{ backgroundColor: avatarColor }}
                className="text-white text-xl font-bold"
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t("welcome", { name: user.username ?? "" })}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                {t("welcomeSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {t("studentDashboard")}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/student-profile`)}
            >
              {t("viewProfile")}
            </Button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      {dataLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div
                    className={`p-2 sm:p-2.5 rounded-xl ${stat.bgLight}`}
                  >
                    <stat.icon
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.textColor}`}
                    />
                  </div>
                </div>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Upcoming Classes ── */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {t("upcomingClasses")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-primary"
                    onClick={() => router.push(`/${locale}/bookings`)}
                  >
                    {t("seeAll")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {dataLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  </div>
                ) : upcomingLessons.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <Calendar className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("noUpcomingClasses")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${locale}/tutors`)}
                    >
                      {t("browseClasses")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingLessons.map((lesson) => {
                      const tutorAvatar = getTutorAvatar(lesson);
                      const tutorColor = getAvatarColor(lesson.tutorUsername);

                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            {tutorAvatar ? (
                              <AvatarImage
                                src={tutorAvatar}
                                alt={lesson.tutorUsername}
                              />
                            ) : null}
                            <AvatarFallback
                              style={{ backgroundColor: tutorColor }}
                              className="text-white text-sm font-semibold"
                            >
                              {lesson.tutorUsername[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {lesson.subjectName ?? "—"}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                              {lesson.tutorUsername}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              {formatDate(lesson.scheduled_date_time)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatTime(lesson.scheduled_date_time)} ·{" "}
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
          </div>

          {/* ── Quick Actions ── */}
          <div>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t("quickActions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 grid grid-cols-2 lg:grid-cols-1 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                  >
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} shadow-sm`}
                    >
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4 ml-auto text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Tutor Banner ── */}
        {user.is_tutor && (
          <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg">
                    {t("tutorDashboard")}
                  </p>
                  <p className="text-sm text-white/80">
                    {t("goToTutorDashboard")}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-0"
                onClick={() => router.push(`/${locale}/tutor/dashboard`)}
              >
                {t("goToTutorDashboard")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

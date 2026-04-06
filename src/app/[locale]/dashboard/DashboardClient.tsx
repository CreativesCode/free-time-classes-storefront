"use client";

import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useTranslations, useLocale } from "@/i18n/translations";
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
  Bell,
  Flame,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { DashboardRecommendedCourse } from "./DashboardDeferredRecommended";

const DashboardDeferredRecommended = dynamic(
  () => import("./DashboardDeferredRecommended"),
  {
    loading: () => (
      <div className="min-h-[220px] animate-pulse rounded-xl border border-violet-100/70 bg-white/50 dark:border-slate-800 dark:bg-slate-900/40" />
    ),
  }
);

const DashboardDeferredSidebar = dynamic(
  () => import("./DashboardDeferredSidebar"),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="min-h-[320px] animate-pulse rounded-3xl border border-violet-100/70 bg-white/50 dark:border-slate-800 dark:bg-slate-900/40" />
      </div>
    ),
  }
);

interface DashboardUser {
  id: string;
  username: string | null;
  profile_picture: string | null;
  is_tutor: boolean;
}

interface UpcomingLesson {
  id: string;
  scheduled_date_time: string;
  duration_minutes: number;
  status: string;
  subjectName: string | null;
  tutorUsername: string;
  tutorPicture: string | null;
  meetLink: string | null;
}

interface DashboardStats {
  totalClasses: number;
  totalHours: number;
  totalTutors: number;
  pendingRequests: number;
}

interface DashboardClientProps {
  user: DashboardUser;
  stats: DashboardStats;
  upcomingLessons: UpcomingLesson[];
  recommendedCourses: DashboardRecommendedCourse[];
}

export default function DashboardClient({
  user,
  stats,
  upcomingLessons,
  recommendedCourses,
}: DashboardClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");

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
      bgLight: "bg-blue-50 dark:bg-blue-950/40",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: t("totalHours"),
      value: stats.totalHours,
      icon: Clock,
      bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("totalTutors"),
      value: stats.totalTutors,
      icon: Users,
      bgLight: "bg-violet-50 dark:bg-violet-950/40",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: t("pendingRequests"),
      value: stats.pendingRequests,
      icon: Calendar,
      bgLight: "bg-amber-50 dark:bg-amber-950/40",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const getTutorAvatar = (lesson: UpcomingLesson) => {
    const pic = lesson.tutorPicture;
    if (!pic) return null;
    return pic.startsWith("http") ? pic : getPublicUrl("avatars", pic);
  };

  const sidebarItems = [
    { label: "Dashboard", icon: BookOpen, href: `/${locale}/dashboard`, active: true },
    { label: "Mis clases", icon: GraduationCap, href: `/${locale}/courses` },
    { label: "Tutores", icon: Users, href: `/${locale}/tutors` },
    { label: "Progreso", icon: TrendingUp, href: `/${locale}/bookings` },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#fef3ff] pb-28 md:flex-row md:pb-0 dark:bg-slate-950">
      <aside className="order-first hidden w-20 shrink-0 flex-col items-center gap-4 self-stretch border-r border-violet-100/70 bg-[#faecff] py-5 md:flex lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 h-10 w-10 rounded-xl bg-[#702ae1] text-white grid place-items-center font-black">
          F
        </div>
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => router.push(item.href)}
            className={`rounded-2xl p-3 transition ${
              item.active
                ? "bg-[#edd3ff] text-[#702ae1] dark:bg-slate-800 dark:text-violet-200"
                : "text-slate-500 hover:bg-violet-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </aside>

      <aside className="order-first hidden w-64 shrink-0 flex-col gap-8 self-stretch border-r border-violet-100/70 bg-[#faecff] p-6 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#702ae1] text-white grid place-items-center font-black">
            F
          </div>
          <div>
            <p className="text-lg font-black text-[#702ae1]">FreeTime</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
              Classes
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                item.active
                  ? "translate-x-1 bg-[#edd3ff] text-[#702ae1] dark:bg-slate-800 dark:text-violet-200"
                  : "text-slate-600 hover:bg-violet-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-violet-100/70 bg-[#fef3ff]/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <p className="text-lg font-extrabold tracking-tight text-[#702ae1] md:hidden">
              FreeTime
            </p>
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
              <input
                type="text"
                placeholder="Buscar clases, tutores..."
                className="h-10 w-80 rounded-2xl border border-violet-200/70 bg-white/75 pl-9 pr-3 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-full bg-violet-100/80 p-2.5 text-violet-700 transition-colors hover:bg-violet-200 dark:bg-slate-800 dark:text-violet-300"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <Avatar className="h-10 w-10 ring-2 ring-violet-100 dark:ring-slate-800">
              {profilePictureUrl ? (
                <AvatarImage src={profilePictureUrl} alt={user.username ?? ""} />
              ) : null}
              <AvatarFallback
                style={{ backgroundColor: avatarColor }}
                className="font-semibold text-white"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        </header>

        <div className="w-full space-y-6 px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:space-y-8 lg:px-8 lg:pt-8">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl lg:text-5xl">
              {t("welcome", { name: user.username ?? "" })}
            </h1>
            <Badge className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
              {t("studentDashboard")}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">
            {t("welcomeSubtitle")}
          </p>
        </section>


        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#702ae1] to-[#b28cff] p-5 text-white shadow-xl shadow-violet-300/40 sm:p-8">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-fuchsia-300/25 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100">
                Tu meta semanal
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                Estas a un paso de completar tu objetivo de estudio.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-xl bg-white font-semibold text-[#702ae1] hover:bg-violet-50"
                  onClick={() => router.push(`/${locale}/courses`)}
                >
                  {t("browseCourses")}
                </Button>
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur">
                  <Flame className="h-4 w-4" />
                  Racha de 12 dias
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-100">
                Progreso semanal
              </p>
              <div className="mt-3 flex h-20 items-end gap-1.5">
                {[40, 55, 38, 75, 90, 62, 48].map((h) => (
                  <div
                    key={h}
                    className="w-3 rounded-t-md bg-white/40"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="overflow-hidden rounded-md border-violet-100/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-md p-2 ${stat.bgLight}`}>
                    <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-3xl border-violet-100/70 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("upcomingClasses")}
                  </p>
                  <Button
                    variant="ghost"
                    className="text-violet-700 dark:text-violet-300"
                    onClick={() => router.push(`/${locale}/bookings`)}
                  >
                    {t("seeAll")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {upcomingLessons.length === 0 ? (
                  <div className="space-y-3 py-8 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("noUpcomingClasses")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/${locale}/tutors`)}
                    >
                      {t("findTutor")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  upcomingLessons.map((lesson, index) => {
                    const tutorAvatar = getTutorAvatar(lesson);
                    const tutorColor = getAvatarColor(lesson.tutorUsername);
                    const isSoon = index === 0;

                    return (
                      <div
                        key={lesson.id}
                        className="flex flex-col gap-3 rounded-2xl border border-violet-100/80 bg-[#faf5ff] p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
                          <Avatar className="h-11 w-11 shrink-0">
                            {tutorAvatar ? (
                              <AvatarImage
                                src={tutorAvatar}
                                alt={lesson.tutorUsername}
                              />
                            ) : null}
                            <AvatarFallback
                              style={{ backgroundColor: tutorColor }}
                              className="font-semibold text-white"
                            >
                              {lesson.tutorUsername[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {lesson.subjectName ?? "Clase"}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {lesson.tutorUsername}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {formatDate(lesson.scheduled_date_time)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatTime(lesson.scheduled_date_time)} ·{" "}
                              {lesson.duration_minutes} min
                            </p>
                          </div>
                          {lesson.meetLink ? (
                            <Button
                              size="sm"
                              className={
                                isSoon
                                  ? "rounded-xl bg-[#702ae1] hover:bg-[#5f21c4]"
                                  : "rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-slate-700 dark:text-slate-100"
                              }
                              onClick={() => window.open(lesson.meetLink!, "_blank")}
                            >
                              <Video className="mr-1 h-4 w-4" />
                              {isSoon ? t("joinClass") : t("openVideoCall")}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => router.push(`/${locale}/bookings`)}
                            >
                              {t("viewDetails")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <DashboardDeferredRecommended courses={recommendedCourses} />
          </div>

          <div className="space-y-6 lg:col-span-4">
            <DashboardDeferredSidebar isTutor={user.is_tutor} />
          </div>
        </section>

        </div>
      </div>
    </div>
  );
}

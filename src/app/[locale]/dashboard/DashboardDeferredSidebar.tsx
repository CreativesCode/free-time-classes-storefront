"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useTranslations, useLocale } from "@/i18n/translations";
import {
  Calendar,
  GraduationCap,
  MessageSquare,
  Search,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  isTutor: boolean;
}

export default function DashboardDeferredSidebar({ isTutor }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");

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

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-violet-100/70 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <CardHeader className="pb-2">
          <p className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            {t("quickActions")}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => router.push(action.href)}
              className="group flex items-center gap-3 rounded-2xl bg-[#faf5ff] p-3 text-left transition hover:bg-violet-100 dark:bg-slate-800/50 dark:hover:bg-slate-700/70"
            >
              <div
                className={`rounded-xl bg-gradient-to-br p-2 ${action.gradient}`}
              >
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {action.label}
              </span>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </CardContent>
      </Card>

      {isTutor && (
        <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2.5">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{t("tutorDashboard")}</p>
                <p className="text-xs text-white/85">
                  {t("goToTutorDashboard")}
                </p>
              </div>
            </div>
            <Button
              className="w-full rounded-xl bg-white/20 text-white hover:bg-white/30"
              onClick={() => router.push(`/${locale}/tutor/dashboard`)}
            >
              {t("goToTutorDashboard")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

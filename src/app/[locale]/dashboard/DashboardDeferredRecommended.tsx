"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useLocale } from "@/i18n/translations";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardDeferredRecommended() {
  const router = useRouter();
  const locale = useLocale();

  const recommendedCourses = [
    {
      title: "UX Research: Desde Cero",
      category: "Diseno",
      rating: "4.9",
      duration: "24h",
      href: `/${locale}/courses`,
    },
    {
      title: "Estrategias de Growth",
      category: "Negocios",
      rating: "4.7",
      duration: "18h",
      href: `/${locale}/courses`,
    },
  ];

  return (
    <Card className="rounded-3xl border-violet-100/70 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            Recomendados para ti
          </p>
          <Button
            variant="ghost"
            className="text-violet-700 dark:text-violet-300"
            onClick={() => router.push(`/${locale}/courses`)}
          >
            Ver todo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {recommendedCourses.map((course) => (
          <button
            key={course.title}
            type="button"
            onClick={() => router.push(course.href)}
            className="rounded-2xl border border-violet-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
              {course.category}
            </p>
            <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {course.title}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                {course.rating}
              </span>
              <span>{course.duration}</span>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

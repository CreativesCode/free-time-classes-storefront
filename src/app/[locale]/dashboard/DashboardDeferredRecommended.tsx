"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useLocale, useTranslations } from "@/i18n/translations";
import { getCourseCoverPublicUrl } from "@/lib/supabase/storage";
import { Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export type DashboardRecommendedCourse = {
  id: string;
  title: string;
  cover_image: string | null;
  rating: number | null;
  duration_minutes: number;
  subjectName: string | null;
  tutorName: string | null;
};

export default function DashboardDeferredRecommended({
  courses,
}: {
  courses: DashboardRecommendedCourse[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");

  return (
    <Card className="rounded-ft-lg border-ft-line bg-ft-paper shadow-none dark:border-slate-800 dark:bg-slate-900/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {t("recommendedForYou")}
          </p>
          <Button
            variant="ghost"
            className="text-ft-accent-deep dark:text-violet-300"
            onClick={() => router.push(`/${locale}/courses`)}
          >
            {t("seeAll")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <div className="col-span-full rounded-ft border border-dashed border-ft-line bg-ft-surface-1/50 py-10 text-center text-sm text-ft-ink-3 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
            {t("recommendedEmpty")}
          </div>
        ) : (
          courses.map((course) => {
            const coverUrl = getCourseCoverPublicUrl(course.cover_image);
            const category =
              course.subjectName?.trim() || t("defaultCourseCategory");
            const rating = course.rating ?? 0;
            const durationLabel =
              course.duration_minutes >= 60
                ? t("durationHoursShort", {
                    hours: Math.round(course.duration_minutes / 60),
                  })
                : t("durationMinutesShort", {
                    minutes: course.duration_minutes,
                  });

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => router.push(`/${locale}/courses/${course.id}`)}
                className="overflow-hidden rounded-ft-lg border border-ft-line bg-ft-surface-1 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative h-32 w-full bg-gradient-to-br from-ft-accent to-ft-accent-deep">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ft-accent-deep dark:text-violet-300">
                    {category}
                  </p>
                  <p className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
                    {course.title}
                  </p>
                  <div className="space-y-1.5">
                    {course.tutorName ? (
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {course.tutorName}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {rating.toFixed(1)}
                      </span>
                      <span>{durationLabel}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useLocale } from "@/i18n/translations";
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

  return (
    <Card className="rounded-xl border-violet-100/70 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
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
        {courses.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-violet-200 bg-violet-50/40 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
            Aún no hay cursos disponibles. Explora el catálogo próximamente.
          </div>
        ) : (
          courses.map((course) => {
            const coverUrl = getCourseCoverPublicUrl(course.cover_image);
            const category =
              course.subjectName?.trim() || "Curso";
            const rating = course.rating ?? 0;
            const durationLabel =
              course.duration_minutes >= 60
                ? `${Math.round(course.duration_minutes / 60)} h`
                : `${course.duration_minutes} min`;

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => router.push(`/${locale}/courses/${course.id}`)}
                className="overflow-hidden rounded-lg border border-violet-100 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative h-32 w-full bg-gradient-to-br from-violet-600/90 via-purple-600/85 to-fuchsia-500/80">
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
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

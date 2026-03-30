"use client";

import TutorCoursesManager from "@/components/teacher/TutorCoursesManager";
import { useTranslations } from "@/i18n/translations";
import type { CourseWithRelations } from "@/types/course";

export default function CoursesCreateClient({
  tutorId,
  initialCourses,
}: {
  tutorId: string;
  initialCourses: CourseWithRelations[];
}) {
  const t = useTranslations("teacherProfile.coursesManager");

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="mb-4 text-xl font-bold text-primary-800 sm:text-2xl">
        {t("title")}
      </h1>
      <TutorCoursesManager tutorId={tutorId} initialCourses={initialCourses} />
    </div>
  );
}

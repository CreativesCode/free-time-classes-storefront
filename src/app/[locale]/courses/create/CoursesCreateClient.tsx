"use client";

import TutorCoursesManager from "@/components/teacher/TutorCoursesManager";
import { StudentSidebarNav } from "@/components/ds/StudentSidebarNav";
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
    <div className="mx-auto w-full max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl lg:px-9 lg:py-8">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <StudentSidebarNav isTutor />

        <div className="min-w-0">
          <header className="px-5 pb-4 pt-[18px] md:px-9 md:pt-8 lg:px-0 lg:pt-0">
            <h1 className="m-0 text-[28px] font-semibold tracking-[-0.025em] text-ft-ink md:text-[32px]">
              {t("title")}
            </h1>
          </header>
          <div className="px-5 pb-6 md:px-9 lg:px-0">
            <TutorCoursesManager tutorId={tutorId} initialCourses={initialCourses} />
          </div>
        </div>
      </div>
    </div>
  );
}

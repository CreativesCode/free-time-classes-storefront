"use client";

import TutorCoursesManager from "@/components/teacher/TutorCoursesManager";
import { useAuth } from "@/context/UserContext";
import { useLocale } from "@/i18n/translations";
import { useTranslations } from "@/i18n/translations";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TutorCoursesCreatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("teacherProfile.coursesManager");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [isLoading, user, router, locale]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="mb-4 text-xl font-bold text-primary-800 sm:text-2xl">{t("title")}</h1>
      <TutorCoursesManager tutorId={user.id} />
    </div>
  );
}

